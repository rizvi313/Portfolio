'use client';
import styled from 'styled-components';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';

const LogoWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  width: ${({ $width }) => $width || '40px'};
  transition: transform 0.3s ease;

  img {
    width: 100%;
    height: auto;
    object-fit: contain;
    filter: ${({ $isDark }) => ($isDark ? 'none' : 'invert(1) brightness(0)')};
    transition: filter 0.3s ease;
  }
`;

export default function Logo({ width, className }) {
  const { isDark } = useTheme();

  return (
    <LogoWrapper className={className} $width={width} $isDark={isDark}>
      <Image
        src="/logo-fnl-trs-grn.png"
        alt="SAR Logo"
        width={200}
        height={130}
        priority
        style={{ width: '100%', height: 'auto' }}
      />
    </LogoWrapper>
  );
}