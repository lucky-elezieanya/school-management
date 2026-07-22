import Image from "next/image";

interface SignatureProps {
  image?: string | null;
  alt?: string;
}

export default function Signature({
  image,
  alt = "Signature",
}: SignatureProps) {
  if (!image) {
    return <div className="w-[120px] h-[60px]" />;
  }

  return (
    <div
      className="
        w-[120px]
        flex
        justify-center
        items-end
      "
    >
      <Image
        src={image}
        alt={alt}
        width={120}
        height={60}
        className="
          max-h-[60px]
          w-auto
          object-contain
        "
      />
    </div>
  );
}
