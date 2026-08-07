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
    return <div className="w-[120px h-[80px]"  />;
  }

  return (
    <div
      className="
       w-[120px] h-[80px]
        flex
        justify-center
     
      "
    >
      <img
        src={image}
        alt={alt}
        width={100}
        height={50}
        loading="eager"
        className="
          object-contain
        "
      />
    </div>
  );
}
