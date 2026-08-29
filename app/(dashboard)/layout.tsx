import { Header } from "@/components/header";
import { Suspense } from "react";

type Props = {
  children: React.ReactNode;
};

const DashboardLayout = ({ children }: Props) => {
  return (
    <>
    <Header />
      <main className="px-3 lg:px-14">
        <Suspense>{children}</Suspense>
      </main>
    </>
  );
};

export default DashboardLayout;
