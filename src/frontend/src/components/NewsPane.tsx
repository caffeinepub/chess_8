import { Newspaper } from "lucide-react";

interface NewsItem {
  title: string;
  date: string;
  summary: string;
  source: string;
}

const CHESS_NEWS: NewsItem[] = [
  {
    title: "2026 FIDE Candidates Tournament: Gukesh Leads After Round 12",
    date: "Apr 7, 2026",
    summary:
      "D. Gukesh holds a half-point lead at the halfway stage of the 2026 FIDE Candidates in Toronto, with Pragg and Caruana in close pursuit. The defending champion showed impressive preparation in the Catalan Opening.",
    source: "FIDE",
  },
  {
    title: "Carlsen Defeats Nepomniachtchi in Thrilling Armageddon Playoff",
    date: "Apr 3, 2026",
    summary:
      "Magnus Carlsen overcame Ian Nepomniachtchi in a dramatic Armageddon tiebreaker at the Oslo Chess Invitational, extending his unbeaten rapid run to 34 games. Nepo cited time pressure as a decisive factor.",
    source: "Chess.com",
  },
  {
    title: "Ding Liren Scores First Classical Win of 2026",
    date: "Mar 28, 2026",
    summary:
      "World Champion Ding Liren ended a 14-game winless streak in classical chess at the Grenke Classic, defeating Vincent Keymer with the Black pieces in a complex Nimzo-Indian middlegame.",
    source: "Chess24",
  },
  {
    title: "Nakamura Reaches 5 Million Twitch Followers",
    date: "Mar 22, 2026",
    summary:
      "Hikaru Nakamura becomes the first chess streamer to surpass 5 million Twitch followers, celebrating the milestone with a 12-hour marathon stream featuring commentary, bullet chess, and viewer challenges.",
    source: "Twitch",
  },
  {
    title: "World Rapid & Blitz 2025: Standings and Highlights",
    date: "Dec 30, 2025",
    summary:
      "Abdusattorov claimed the Rapid title in Warsaw while Firouzja took Blitz gold in a tense final round. Carlsen, playing without FIDE rating impact, finished a dominant third in both events.",
    source: "FIDE",
  },
  {
    title: "Women's World Championship: Tan Zhongyi Retains Title",
    date: "Feb 18, 2026",
    summary:
      "Tan Zhongyi successfully defended her Women's World Championship title against Nino Batsiashvili with a score of 8.5–7.5 in Shanghai, securing her third consecutive world title.",
    source: "ChessBase",
  },
];

export function NewsPane() {
  return (
    <div className="px-4 py-3">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2.5">
        <Newspaper className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
        <h3 className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase">
          Chess News
        </h3>
      </div>

      {/* News list */}
      <ul className="space-y-3" data-ocid="news-list">
        {CHESS_NEWS.map((item) => (
          <li
            key={item.title}
            className="border-b border-border/40 pb-3 last:border-b-0 last:pb-0"
            data-ocid="news-item"
          >
            <p className="text-[11px] font-display font-semibold text-foreground leading-snug mb-0.5">
              {item.title}
            </p>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                {item.date}
              </span>
              <span className="text-[10px] text-muted-foreground/40">·</span>
              <span className="text-[10px] text-primary/60 font-display uppercase tracking-wide">
                {item.source}
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              {item.summary}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
