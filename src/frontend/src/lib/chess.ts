import type {
  BoardState,
  GameState,
  Move,
  Piece,
  PieceColor,
  PieceType,
  Position,
  Square,
} from "../types/chess";

// ─── Board Initialization ─────────────────────────────────────────────────────

const BACK_RANK: PieceType[] = [
  "Rook",
  "Knight",
  "Bishop",
  "Queen",
  "King",
  "Bishop",
  "Knight",
  "Rook",
];

export function initBoard(): BoardState {
  const board: BoardState = Array.from({ length: 8 }, () =>
    Array(8).fill(null),
  );

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: BACK_RANK[col], color: "Black", hasMoved: false };
    board[1][col] = { type: "Pawn", color: "Black", hasMoved: false };
    board[6][col] = { type: "Pawn", color: "White", hasMoved: false };
    board[7][col] = { type: BACK_RANK[col], color: "White", hasMoved: false };
  }

  return board;
}

export function createInitialGameState(): GameState {
  const board = initBoard();
  return {
    board,
    currentTurn: "White",
    status: "playing",
    moves: [],
    moveHistory: [],
    capturedByWhite: [],
    capturedByBlack: [],
    enPassantTarget: null,
    halfMoveClock: 0,
    positionHistory: [boardToFEN(board, "White", null)],
    selectedSquare: null,
    legalMovesForSelected: [],
    promotionPending: null,
  };
}

// ─── Board Serialization ──────────────────────────────────────────────────────

function pieceToChar(piece: Piece): string {
  const map: Record<PieceType, string> = {
    King: "k",
    Queen: "q",
    Rook: "r",
    Bishop: "b",
    Knight: "n",
    Pawn: "p",
  };
  const c = map[piece.type];
  return piece.color === "White" ? c.toUpperCase() : c;
}

export function boardToFEN(
  board: BoardState,
  turn: PieceColor,
  enPassant: Position | null,
): string {
  const rows = board
    .map((row) =>
      row.map((sq: Square) => (sq ? pieceToChar(sq) : "1")).join(""),
    )
    .join("/");
  const ep = enPassant
    ? `${String.fromCharCode(97 + enPassant.col)}${8 - enPassant.row}`
    : "-";
  return `${rows} ${turn === "White" ? "w" : "b"} ${ep}`;
}

// ─── Move Generation ──────────────────────────────────────────────────────────

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function getRawMoves(
  board: BoardState,
  pos: Position,
  enPassantTarget: Position | null,
): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const moves: Position[] = [];
  const { row, col } = pos;
  const enemy = piece.color === "White" ? "Black" : "White";

  const addIfValid = (r: number, c: number): boolean => {
    if (!inBounds(r, c)) return false;
    const target = board[r][c];
    if (target && target.color === piece.color) return false;
    moves.push({ row: r, col: c });
    return !target;
  };

  const slide = (dr: number, dc: number) => {
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c)) {
      const target = board[r][c];
      if (target) {
        if (target.color === enemy) moves.push({ row: r, col: c });
        break;
      }
      moves.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
  };

  // suppress unused warning for addIfValid used only in Knight case
  void addIfValid;

  switch (piece.type) {
    case "Pawn": {
      const dir = piece.color === "White" ? -1 : 1;
      const startRow = piece.color === "White" ? 6 : 1;
      if (inBounds(row + dir, col) && !board[row + dir][col]) {
        moves.push({ row: row + dir, col });
        if (row === startRow && !board[row + 2 * dir][col]) {
          moves.push({ row: row + 2 * dir, col });
        }
      }
      for (const dc of [-1, 1]) {
        if (inBounds(row + dir, col + dc)) {
          const target = board[row + dir][col + dc];
          if (target && target.color === enemy) {
            moves.push({ row: row + dir, col: col + dc });
          }
          if (
            enPassantTarget &&
            enPassantTarget.row === row + dir &&
            enPassantTarget.col === col + dc
          ) {
            moves.push({ row: row + dir, col: col + dc });
          }
        }
      }
      break;
    }
    case "Knight": {
      const jumps: [number, number][] = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ];
      for (const [dr, dc] of jumps) addIfValid(row + dr, col + dc);
      break;
    }
    case "Bishop":
      for (const [dr, dc] of [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ] as [number, number][])
        slide(dr, dc);
      break;
    case "Rook":
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as [number, number][])
        slide(dr, dc);
      break;
    case "Queen":
      for (const [dr, dc] of [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ] as [number, number][])
        slide(dr, dc);
      break;
    case "King": {
      for (const [dr, dc] of [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ] as [number, number][]) {
        addIfValid(row + dr, col + dc);
      }
      if (!piece.hasMoved && !isInCheck(board, piece.color, enPassantTarget)) {
        const backRow = piece.color === "White" ? 7 : 0;
        const krRook = board[backRow][7];
        if (
          krRook &&
          krRook.type === "Rook" &&
          !krRook.hasMoved &&
          !board[backRow][5] &&
          !board[backRow][6] &&
          !isSquareAttacked(board, { row: backRow, col: 5 }, enemy, null) &&
          !isSquareAttacked(board, { row: backRow, col: 6 }, enemy, null)
        ) {
          moves.push({ row: backRow, col: 6 });
        }
        const qsRook = board[backRow][0];
        if (
          qsRook &&
          qsRook.type === "Rook" &&
          !qsRook.hasMoved &&
          !board[backRow][1] &&
          !board[backRow][2] &&
          !board[backRow][3] &&
          !isSquareAttacked(board, { row: backRow, col: 3 }, enemy, null) &&
          !isSquareAttacked(board, { row: backRow, col: 2 }, enemy, null)
        ) {
          moves.push({ row: backRow, col: 2 });
        }
      }
      break;
    }
  }

  return moves;
}

export function getLegalMoves(
  board: BoardState,
  pos: Position,
  enPassantTarget: Position | null,
): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const raw = getRawMoves(board, pos, enPassantTarget);
  return raw.filter((to) => {
    const simulated = simulateMove(board, pos, to, enPassantTarget);
    return !isInCheck(simulated, piece.color, null);
  });
}

// ─── Check Detection ──────────────────────────────────────────────────────────

function isSquareAttacked(
  board: BoardState,
  pos: Position,
  byColor: PieceColor,
  _enPassant: Position | null,
): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === byColor) {
        const rawMoves = getRawMovesNoKingCastle(board, { row: r, col: c });
        if (rawMoves.some((m) => m.row === pos.row && m.col === pos.col))
          return true;
      }
    }
  }
  return false;
}

function getRawMovesNoKingCastle(board: BoardState, pos: Position): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const moves: Position[] = [];
  const { row, col } = pos;
  const enemy = piece.color === "White" ? "Black" : "White";

  const slide = (dr: number, dc: number) => {
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c)) {
      const target = board[r][c];
      if (target) {
        if (target.color === enemy) moves.push({ row: r, col: c });
        break;
      }
      moves.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
  };

  switch (piece.type) {
    case "Pawn": {
      const dir = piece.color === "White" ? -1 : 1;
      for (const dc of [-1, 1]) {
        if (inBounds(row + dir, col + dc)) {
          moves.push({ row: row + dir, col: col + dc });
        }
      }
      break;
    }
    case "Knight": {
      const jumps: [number, number][] = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ];
      for (const [dr, dc] of jumps) {
        if (inBounds(row + dr, col + dc))
          moves.push({ row: row + dr, col: col + dc });
      }
      break;
    }
    case "Bishop":
      for (const [dr, dc] of [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ] as [number, number][])
        slide(dr, dc);
      break;
    case "Rook":
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as [number, number][])
        slide(dr, dc);
      break;
    case "Queen":
      for (const [dr, dc] of [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ] as [number, number][])
        slide(dr, dc);
      break;
    case "King":
      for (const [dr, dc] of [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ] as [number, number][]) {
        if (inBounds(row + dr, col + dc))
          moves.push({ row: row + dr, col: col + dc });
      }
      break;
  }

  return moves;
}

export function isInCheck(
  board: BoardState,
  color: PieceColor,
  _enPassant: Position | null,
): boolean {
  const enemy = color === "White" ? "Black" : "White";
  let kingPos: Position | null = null;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === "King" && p.color === color) {
        kingPos = { row: r, col: c };
      }
    }
  }

  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos, enemy, null);
}

// ─── Move Simulation ──────────────────────────────────────────────────────────

function simulateMove(
  board: BoardState,
  from: Position,
  to: Position,
  enPassant: Position | null,
): BoardState {
  const newBoard = board.map((row) => [...row]) as BoardState;
  const piece = newBoard[from.row][from.col];
  if (!piece) return newBoard;

  if (
    piece.type === "Pawn" &&
    enPassant &&
    to.row === enPassant.row &&
    to.col === enPassant.col
  ) {
    newBoard[from.row][to.col] = null;
  }

  if (
    piece.type === "King" &&
    !piece.hasMoved &&
    Math.abs(to.col - from.col) === 2
  ) {
    const backRow = from.row;
    if (to.col === 6) {
      newBoard[backRow][5] = { ...newBoard[backRow][7]! };
      newBoard[backRow][7] = null;
    } else if (to.col === 2) {
      newBoard[backRow][3] = { ...newBoard[backRow][0]! };
      newBoard[backRow][0] = null;
    }
  }

  newBoard[to.row][to.col] = { ...piece, hasMoved: true };
  newBoard[from.row][from.col] = null;
  return newBoard;
}

// ─── Move Application ─────────────────────────────────────────────────────────

function buildNotation(board: BoardState, move: Move): string {
  const { piece, from, to, captured, isCastle, isPromotion, promotion } = move;

  if (isCastle === "kingside") return "O-O";
  if (isCastle === "queenside") return "O-O-O";

  const pieceChar =
    piece.type === "Pawn" ? "" : piece.type === "Knight" ? "N" : piece.type[0];

  const hasPawnCapture =
    piece.type === "Pawn" && (captured || from.col !== to.col);
  const captureStr =
    (captured && piece.type !== "Pawn") || hasPawnCapture ? "x" : "";
  const fileStr = hasPawnCapture
    ? String.fromCharCode(97 + from.col)
    : pieceChar;
  const dest = `${String.fromCharCode(97 + to.col)}${8 - to.row}`;
  const promoStr = isPromotion && promotion ? `=${promotion[0]}` : "";

  // Avoid unused board warning
  void board;

  return `${fileStr}${captureStr}${dest}${promoStr}`;
}

export function applyMove(
  state: GameState,
  from: Position,
  to: Position,
  promotion?: PieceType,
): GameState {
  const board = state.board.map((row) => [...row]) as BoardState;
  const piece = board[from.row][from.col];
  if (!piece) return state;

  const captured = board[to.row][to.col] ?? undefined;
  const isEnPassant =
    piece.type === "Pawn" &&
    state.enPassantTarget !== null &&
    to.row === state.enPassantTarget.row &&
    to.col === state.enPassantTarget.col;

  const isCastle =
    piece.type === "King" &&
    !piece.hasMoved &&
    Math.abs(to.col - from.col) === 2
      ? to.col === 6
        ? ("kingside" as const)
        : ("queenside" as const)
      : undefined;

  const isPromotion = piece.type === "Pawn" && (to.row === 0 || to.row === 7);

  if (isPromotion && !promotion) {
    const newBoard = simulateMove(board, from, to, state.enPassantTarget);
    return { ...state, board: newBoard, promotionPending: to };
  }

  const enPassantCaptured: Piece | undefined = isEnPassant
    ? (board[from.row][to.col] ?? undefined)
    : undefined;

  const move: Move = {
    from,
    to,
    piece,
    captured: isEnPassant ? enPassantCaptured : captured,
    promotion: isPromotion ? (promotion ?? "Queen") : undefined,
    isCastle,
    isEnPassant,
    isPromotion,
  };
  move.notation = buildNotation(board, move);

  let newBoard = simulateMove(board, from, to, state.enPassantTarget);

  if (isPromotion) {
    newBoard[to.row][to.col] = {
      type: promotion ?? "Queen",
      color: piece.color,
      hasMoved: true,
    };
  }

  if (isEnPassant) {
    newBoard[from.row][to.col] = null;
  }

  const nextTurn: PieceColor =
    state.currentTurn === "White" ? "Black" : "White";

  let newEnPassantTarget: Position | null = null;
  if (piece.type === "Pawn" && Math.abs(to.row - from.row) === 2) {
    newEnPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
  }

  const newHalfMoveClock =
    piece.type === "Pawn" || !!captured || isEnPassant
      ? 0
      : state.halfMoveClock + 1;
  const fenKey = boardToFEN(newBoard, nextTurn, newEnPassantTarget);
  const newPositionHistory = [...state.positionHistory, fenKey];

  const capturedPiece = move.captured;
  const newCapturedByWhite =
    piece.color === "White" && capturedPiece
      ? [...state.capturedByWhite, capturedPiece]
      : state.capturedByWhite;
  const newCapturedByBlack =
    piece.color === "Black" && capturedPiece
      ? [...state.capturedByBlack, capturedPiece]
      : state.capturedByBlack;

  const newMoves = [...state.moves, move];
  const moveNumber = Math.ceil(newMoves.length / 2);
  let newMoveHistory = [...state.moveHistory];
  if (piece.color === "White") {
    newMoveHistory.push({ moveNumber, white: move });
  } else {
    const last = newMoveHistory[newMoveHistory.length - 1];
    if (last && last.moveNumber === moveNumber && !last.black) {
      newMoveHistory[newMoveHistory.length - 1] = { ...last, black: move };
    } else {
      newMoveHistory.push({ moveNumber, black: move });
    }
  }

  const inCheck = isInCheck(newBoard, nextTurn, newEnPassantTarget);
  const hasLegal = hasLegalMoves(newBoard, nextTurn, newEnPassantTarget);

  let status: GameState["status"] = "playing";
  let winner: PieceColor | undefined;

  if (!hasLegal) {
    if (inCheck) {
      status = "checkmate";
      winner = piece.color;
    } else {
      status = "stalemate";
    }
  } else if (inCheck) {
    status = "check";
  } else if (newHalfMoveClock >= 100) {
    status = "draw-fifty";
  } else if (isThreefoldRepetition(newPositionHistory)) {
    status = "draw-threefold";
  } else if (isInsufficientMaterial(newBoard)) {
    status = "draw-insufficient";
  }

  return {
    ...state,
    board: newBoard,
    currentTurn: nextTurn,
    status,
    winner,
    moves: newMoves,
    moveHistory: newMoveHistory,
    capturedByWhite: newCapturedByWhite,
    capturedByBlack: newCapturedByBlack,
    enPassantTarget: newEnPassantTarget,
    halfMoveClock: newHalfMoveClock,
    positionHistory: newPositionHistory,
    selectedSquare: null,
    legalMovesForSelected: [],
    promotionPending: null,
  };
}

// ─── Game State Checks ────────────────────────────────────────────────────────

function hasLegalMoves(
  board: BoardState,
  color: PieceColor,
  enPassant: Position | null,
): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const legal = getLegalMoves(board, { row: r, col: c }, enPassant);
        if (legal.length > 0) return true;
      }
    }
  }
  return false;
}

function isThreefoldRepetition(history: string[]): boolean {
  const counts: Record<string, number> = {};
  for (const pos of history) {
    counts[pos] = (counts[pos] ?? 0) + 1;
    if (counts[pos] >= 3) return true;
  }
  return false;
}

function isInsufficientMaterial(board: BoardState): boolean {
  const pieces: Piece[] = [];
  for (const row of board) for (const sq of row) if (sq) pieces.push(sq);

  const nonKings = pieces.filter((p) => p.type !== "King");
  if (nonKings.length === 0) return true;
  if (nonKings.length === 1) {
    return nonKings[0].type === "Bishop" || nonKings[0].type === "Knight";
  }
  if (nonKings.length === 2) {
    if (
      nonKings[0].color !== nonKings[1].color &&
      nonKings[0].type === "Bishop" &&
      nonKings[1].type === "Bishop"
    ) {
      return true;
    }
  }
  return false;
}

// ─── Piece Unicode ────────────────────────────────────────────────────────────

const PIECE_UNICODE: Record<PieceColor, Record<PieceType, string>> = {
  White: {
    King: "♔",
    Queen: "♕",
    Rook: "♖",
    Bishop: "♗",
    Knight: "♘",
    Pawn: "♙",
  },
  Black: {
    King: "♚",
    Queen: "♛",
    Rook: "♜",
    Bishop: "♝",
    Knight: "♞",
    Pawn: "♟",
  },
};

export function getPieceSymbol(piece: Piece): string {
  return PIECE_UNICODE[piece.color][piece.type];
}

export { getLegalMoves as getMovesForPiece };
