import Image from "next/image";

interface Props {
  logo?: string;
}

export default function Watermark({ logo }: Props) {
  return (
    <div
      className="
                absolute
                inset-0
                flex
                justify-center
                items-center
                pointer-events-none
                opacity-[0.08]
                z-0
            "
    >
      <Image
        src={logo || "/images/logo.jpg"}
        alt=""
        width={500}
        height={500}
        className="object-contain"
      />
    </div>
  );
}
