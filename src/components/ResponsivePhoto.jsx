import { PHOTOS, FORMATS } from '../data/image-manifest';

/**
 * Renders one of the pipeline photos (see src/data/image-manifest.js) as a
 * picture element with AVIF + WebP srcset at every generated width, plus a
 * universally-supported fallback in the underlying img.
 *
 * The picture wrapper is display:contents on purpose: the inner img stays a
 * layout child of whatever container the caller already styled, so switching
 * from a bare image element to a picture element changes nothing visually.
 */
export default function ResponsivePhoto({
  photo,
  sizes = '100vw',
  className = '',
  alt,
  priority = false,
  onError,
  // eslint-disable-next-line no-unused-vars
  ...rest
}) {
  const spec = PHOTOS[photo];
  if (!spec) {
    if (import.meta.env.DEV) console.warn(`ResponsivePhoto: unknown photo "${photo}"`);
    return null;
  }

  const srcSet = (format) => spec.widths.map((w) => `${spec.base}-${w}.${format} ${w}w`).join(', ');

  return (
    <picture className="contents">
      {FORMATS.map((format) => (
        <source key={format} type={`image/${format}`} srcSet={srcSet(format)} sizes={sizes} />
      ))}
      <img
        src={spec.fallback}
        srcSet={srcSet('webp')}
        sizes={sizes}
        alt={alt ?? spec.alt}
        width={spec.intrinsic.width}
        height={spec.intrinsic.height}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...{ fetchpriority: priority ? 'high' : 'auto' }}
        onError={onError}
        {...rest}
      />
    </picture>
  );
}
