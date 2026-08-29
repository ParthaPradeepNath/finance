import { Header } from "@/components/header";
import { Suspense } from "react";

type Props = {
  children: React.ReactNode;
};

const DashboardLayout = ({ children }: Props) => {
  return (
    <>
      <Header />
      <main id="main-content" className="px-3 lg:px-14" tabIndex={-1}>
        <Suspense>{children}</Suspense>
      </main>
    </>
  );
};

export default DashboardLayout;
