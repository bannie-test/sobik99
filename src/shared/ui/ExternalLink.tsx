import type { AnchorHTMLAttributes } from 'react';
import { safeExternalUrl } from '../lib/safeUrl';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'> & { href: string };

/** Link mở tab mới, chỉ chấp nhận https và luôn có rel="noopener noreferrer". */
export function ExternalLink({ href, children, ...rest }: Props) {
  const safe = safeExternalUrl(href);
  if (!safe) return <span {...rest}>{children}</span>;
  return (
    <a {...rest} href={safe} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
