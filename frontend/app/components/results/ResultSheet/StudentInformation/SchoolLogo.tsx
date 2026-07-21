import Image from "next/image";

interface Props {
  logo?: string;
  fallback: string;
}

export default function SchoolLogo({ logo, fallback }: Props) {
  return (
    <div
      className="
        flex
        justify-center
        items-center
        mx-auto
        w-[90px]
        h-full
      "
    >
      <Image
        src={logo || fallback}
        alt="School Logo"
        width={70}
        height={80}
        crossOrigin="anonymous"
        className="object-contain w-auto h-auto"
      />
    </div>
  );
}
