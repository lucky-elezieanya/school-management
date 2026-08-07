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
      <img
        src={logo || fallback}
        alt="School Logo"
        width={70}
        height={80}
   
        className="object-contai w-[70px] h-[80px]"
      />
    </div>
  );
}
