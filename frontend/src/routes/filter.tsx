import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/filter")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div></div>;
}
