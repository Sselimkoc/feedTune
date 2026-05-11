"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function DocsPage() {
  return (
    <div className="light" data-theme="light" style={{ colorScheme: "light" }}>
      <div className="bg-gray-100 text-black min-h-screen">
        <SwaggerUI url="/api/docs" />
      </div>
    </div>
  );
}
