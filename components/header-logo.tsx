import Link from "next/link";
import Image from "next/image";

export const HeaderLogo = () => {
  return (
    <Link href="/">
      <div className="hidden items-center lg:flex">
        <Image src="/logo.svg" height={28} width={28} alt="Logo" />
        <p className="text-white font-semibold text-2xl ml-2.5">Finance</p>
      </div>
    </Link>
  );
};
