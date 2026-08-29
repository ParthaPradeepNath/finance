import * as React from "react";
import { Upload } from "lucide-react";
import { useCSVReader } from "react-papaparse";

import { Button } from "@/components/ui/button";

type UploadResult = {
  data: string[][];
  errors: unknown[];
  meta: Record<string, unknown>;
};

type Props = {
  onUpload: (results: UploadResult) => void;
};

export const UploadButton = ({ onUpload }: Props) => {
  const { CSVReader } = useCSVReader();

  return (
    <CSVReader onUploadAccepted={onUpload}>
      {({
        getRootProps,
      }: {
        getRootProps: () => React.HTMLAttributes<HTMLButtonElement>;
      }) => (
        <Button
          size="sm"
          className="w-full lg:w-auto"
          {...getRootProps()}
        >
          <Upload className="size-4 mr-2" />
          Import
        </Button>
      )}
    </CSVReader>
  );
};