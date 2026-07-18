import Image from "next/image";

interface HeaderProps {
  image?: string;
}

export default function Header({ image }: HeaderProps) {
  return (
    <div
      className="
                flex
                justify-center
                border
                border-[#555]
                mb-[2px]
                bg-white
            "
    >
      <Image
        src={image || "/images/cozzi-header.png"}
        alt="School Header"
        width={1000}
        height={160}
        priority
        className="
                    w-[80%]
                    h-auto
                    object-contain
                "
      />
    </div>
  );
}
