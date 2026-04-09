import { ExternalLink, Youtube } from "lucide-react";

interface YoutubeLink {
  label: string;
  url: string;
}

const GOTHAM_LINKS: YoutubeLink[] = [
  {
    label: "Gotham Chess Channel",
    url: "https://www.youtube.com/@GothamChess",
  },
  {
    label: "Chess Openings Explained",
    url: "https://www.youtube.com/playlist?list=PLBRObSmbZluRiGDWMKtOTJiLy3q0zIfd7",
  },
  {
    label: "How to Win at Chess (Beginner Series)",
    url: "https://www.youtube.com/playlist?list=PLBRObSmbZluT2Gc2mEJHNghS_MV2xB7RY",
  },
  {
    label: "Guess The Elo",
    url: "https://www.youtube.com/results?search_query=gotham+chess+guess+the+elo",
  },
  {
    label: "Gotham Chess Recaps",
    url: "https://www.youtube.com/results?search_query=gotham+chess+recap",
  },
  {
    label: "Beginner to Chess Master",
    url: "https://www.youtube.com/watch?v=mOSFEauFKnY",
  },
  {
    label: "Best Chess Moments",
    url: "https://www.youtube.com/results?search_query=gotham+chess+best+moments",
  },
];

export function YoutubePane() {
  return (
    <div className="px-4 py-3">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2.5">
        <Youtube className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
        <h3 className="text-xs font-display font-semibold text-muted-foreground tracking-widest uppercase">
          YouTube — Gotham Chess
        </h3>
      </div>

      {/* Links list */}
      <ul className="space-y-1" data-ocid="youtube-links">
        {GOTHAM_LINKS.map((link) => (
          <li key={link.label}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-primary/80 hover:text-primary transition-colors group py-0.5"
              data-ocid={`youtube-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
              <span className="truncate">{link.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
