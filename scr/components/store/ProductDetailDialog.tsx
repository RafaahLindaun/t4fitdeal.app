import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ResponsiveDialog from "../ResponsiveDialog";
import { MenuBagIcon } from "../MenuIcons";
import PixNoveltyBadge from "./PixNoveltyBadge";
import { productCategoryLabel, type StoreProduct } from "../../lib/store";
import "./pix-payment.css";

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

type Props = {
  product: StoreProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReserve: (product: StoreProduct) => void;
  onPayNow: (product: StoreProduct) => void;
  reserving?: boolean;
  paying?: boolean;
  alreadyReserved?: boolean;
};

export default function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onReserve,
  onPayNow,
  reserving = false,
  paying = false,
  alreadyReserved = false,
}: Props) {
  const reducedMotion = Boolean(useReducedMotion());
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, product?.id]);

  const images = useMemo(() => {
    if (!product) return [];
    if (product.images.length) return product.images;
    return product.imageUrl
      ? [{ path: product.imageUrl, url: product.imageUrl, order: 0 }]
      : [];
  }, [product]);

  if (!product) return null;

  const current = images[Math.min(index, Math.max(0, images.length - 1))];
  const hasDiscount = product.originalPrice > product.pixPrice;
  const discountPercent = hasDiscount
    ? product.discountPercent > 0
      ? product.discountPercent
      : Math.max(1, Math.round((1 - product.pixPrice / product.originalPrice) * 100))
    : 0;
  const unavailable = product.stock <= 0;
  const reserveDisabled = unavailable || reserving || paying || alreadyReserved;
  const payDisabled = unavailable || paying || reserving || alreadyReserved;
  const stockLabel = unavailable
    ? "Sem estoque"
    : product.stock <= 3
      ? `${product.stock} ${product.stock === 1 ? "unidade disponível" : "últimas unidades"}`
      : `${product.stock} unidades disponíveis`;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Detalhes do produto"
      description="Escolha reservar para pagar na recepção ou pagar agora via Pix."
      className="store-product-detail-dialog"
      bodyClassName="store-product-detail-body"
      ariaDescriptionId="store-product-detail-description"
    >
      <motion.div
        className="store-product-detail-grid"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <section className="store-product-detail-media" aria-label={`Fotos de ${product.name}`}>
          <div className="store-product-detail-main-image">
            {current?.url ? (
              <img
                src={current.url}
                alt={`${product.name}${images.length > 1 ? ` — foto ${index + 1}` : ""}`}
                draggable={false}
              />
            ) : (
              <span className="store-product-detail-placeholder"><MenuBagIcon size={54} /><small>Imagem não disponível</small></span>
            )}
            {hasDiscount ? <b className="store-product-detail-discount">-{discountPercent}%</b> : null}
          </div>
          {images.length > 1 ? (
            <div className="store-product-detail-thumbs" aria-label="Selecionar foto">
              {images.map((image, imageIndex) => (
                <button
                  key={`${image.path}-${imageIndex}`}
                  type="button"
                  className={imageIndex === index ? "is-active" : ""}
                  onClick={() => setIndex(imageIndex)}
                  aria-label={`Ver foto ${imageIndex + 1}`}
                  aria-pressed={imageIndex === index}
                >
                  <img src={image.url} alt="" aria-hidden="true" draggable={false} />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="store-product-detail-copy">
          <div className="store-product-detail-heading">
            <span>{productCategoryLabel(product.category)}</span>
            <h2>{product.name}</h2>
            {product.description ? <p>{product.description}</p> : null}
          </div>

          <div className="store-product-detail-price" aria-label="Preço">
            {hasDiscount ? (
              <div className="store-product-detail-price-before">
                <span>De</span>
                <s>{formatMoney(product.originalPrice)}</s>
                <b>-{discountPercent}%</b>
              </div>
            ) : null}
            <strong>{formatMoney(product.pixPrice)}</strong>
            <small>valor para reserva e retirada na recepção</small>
          </div>

          <div className={`store-product-detail-stock ${unavailable ? "is-empty" : product.stock <= 3 ? "is-low" : "is-ok"}`}>
            <i aria-hidden="true" />
            <span>{stockLabel}</span>
          </div>

          <div className="store-product-detail-actions">
            <motion.button
              type="button"
              className="store-product-detail-reserve"
              disabled={reserveDisabled}
              aria-busy={reserving}
              whileTap={reducedMotion || reserveDisabled ? undefined : { scale: 0.985 }}
              onClick={(event) => {
                event.stopPropagation();
                if (!reserveDisabled) onReserve(product);
              }}
            >
              <strong>{alreadyReserved ? "Reservado" : unavailable ? "Sem estoque" : reserving ? "Reservando..." : "Reservar"}</strong>
              <small>{alreadyReserved ? "Aguardando retirada" : unavailable ? "Consulte a recepção" : "Retire na recepção"}</small>
            </motion.button>

            {product.purchaseEnabled ? (
              <div className="store-product-detail-pay-wrap">
                <motion.button
                  type="button"
                  className="store-product-detail-pay"
                  disabled={payDisabled}
                  aria-busy={paying}
                  whileTap={reducedMotion || payDisabled ? undefined : { scale: 0.985 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!payDisabled) onPayNow(product);
                  }}
                >
                  <strong>{alreadyReserved ? "Você já reservou" : paying ? "Gerando Pix..." : "Pagar agora"}</strong>
                  <small>{alreadyReserved ? "Cancele a reserva para pagar pelo app" : "Retirada garantida"}</small>
                </motion.button>
                {!alreadyReserved && !unavailable ? <PixNoveltyBadge /> : null}
              </div>
            ) : null}
          </div>
        </section>
      </motion.div>
    </ResponsiveDialog>
  );
}
