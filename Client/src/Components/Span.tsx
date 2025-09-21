import styled from "@emotion/styled";

export const Span = styled.span<{ color?: string }>`
  color: ${(p) => p.color};
`;
