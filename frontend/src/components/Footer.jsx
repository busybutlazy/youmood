import { Link } from "react-router-dom";
import { Mail, Instagram } from "lucide-react";
import BrandMark from "./BrandMark";
import { contactInfo } from "@/data/marketing";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-3 lg:px-8">
        <div>
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <BrandMark className="h-6 w-6 text-forest" />
            <span className="text-lg font-semibold">游木工坊</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            以自然為靈感，用雙手創造溫暖。
            <br />
            木製品與拼布的手作生活美學。
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-wider text-foreground">
            快速連結
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="transition-colors hover:text-wood">
                關於我們
              </Link>
            </li>
            <li>
              <Link to="/products" className="transition-colors hover:text-wood">
                產品系列
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition-colors hover:text-wood">
                聯絡我們
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-wider text-foreground">
            聯絡方式
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-forest" />
              <a
                href={`mailto:${contactInfo.email}`}
                className="transition-colors hover:text-wood"
              >
                {contactInfo.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-forest" />
              <span>{contactInfo.instagram}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/70 py-5">
        <p className="text-center text-xs text-muted-foreground">
          © 2025 游木工坊. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
