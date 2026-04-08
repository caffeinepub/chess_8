export type PieceType =
  | "King"
  | "Queen"
  | "Rook"
  | "Bishop"
  | "Knight"
  | "Pawn";
export type PieceColor = "White" | "Black";

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export type Square = Piece | null;

export type BoardState = Square[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  promotion?: PieceType;
  isCastle?: "kingside" | "queenside";
  isEnPassant?: boolean;
  isPromotion?: boolean;
  notation?: string;
}

export interface MoveHistory {
  moveNumber: number;
  white?: Move;
  black?: Move;
}

export type GameStatus =
  | "playing"
  | "check"
  | "checkmate"
  | "stalemate"
  | "draw-threefold"
  | "draw-fifty"
  | "draw-insufficient"
  | "resigned"
  | "timeout";

export interface GameState {
  board: BoardState;
  currentTurn: PieceColor;
  status: GameStatus;
  winner?: PieceColor;
  moves: Move[];
  moveHistory: MoveHistory[];
  capturedByWhite: Piece[];
  capturedByBlack: Piece[];
  enPassantTarget: Position | null;
  halfMoveClock: number;
  positionHistory: string[];
  selectedSquare: Position | null;
  legalMovesForSelected: Position[];
  promotionPending: Position | null;
  isPaused?: boolean;
}
