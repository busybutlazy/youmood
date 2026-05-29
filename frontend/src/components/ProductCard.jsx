import { Link } from "react-router-dom";
import ProductImage from "./ProductImage";
import { formatPrice, getPrimaryImage } from "@/lib/utils";

export default function ProductCard({ product }) {
  const image = getPrimaryImage(product);
  const soldOut = product.stock === 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow duration-300 hover:shadow-md"
    >
      <div className="relative">
        <ProductImage
          src={image}
          alt={product.name}
          className={`aspect-[4/3] w-full${soldOut ? " opacity-60" : ""}`}
        />
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            已售完
          </span>
        )}
      </div>
      <div className="space-y-1.5 p-4">
        {product.category_name && (
          <span className="text-xs font-medium tracking-wider text-forest">
            {product.category_name}
          </span>
        )}
        <h3 className="truncate text-lg font-medium text-foreground">
          {product.name}
        </h3>
        {product.description && (
          <p className="truncate text-sm text-muted-foreground">
            {product.description}
          </p>
        )}
        <p className={`pt-1 text-base font-semibold ${soldOut ? "text-muted-foreground line-through" : "text-wood"}`}>
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
