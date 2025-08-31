import Image from "next/image";

export default function ProductHeroImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={800}
      sizes="(max-width: 768px) 92vw, 800px"
      priority
      className="rounded-2xl object-contain bg-white"
    />
  );
}
