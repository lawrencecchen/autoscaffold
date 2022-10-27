import React from "react";
            import "@unocss/reset/tailwind.css";
            import "uno.css";
            
            export default function Layout(props: { children: React.ReactNode }) {
              return <>{props.children}</>;
            }
            