import { Link } from "react-router-dom";
import ProductImage from "./ProductImage";
import { formatPrice, getPrimaryImage } from "@/lib/utils";

export default function ProductCard({ product }) {
  const image = getPrimaryImage(product);

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow duration-300 hover:shadow-md"
    >
      <ProductImage
        src={image}
        alt={product.name}
        className="aspect-[4/3] w-full"
      />
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
        <p className="pt-1 text-base font-semibold text-wood">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
