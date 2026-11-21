import { useEffect, useState } from 'react';
import type { Cube } from '../../data/types';
import { money } from '../../shared/lib/format';
import { CubeArt } from '../../shared/ui/CubeArt';
import { useModal } from '../../shared/ui/Modal';

const CONFIRM_DELAY_MS = 1500;
const STEP_INTERVAL_MS = 1800;
const STEPS = ['Đang đóng gói', 'Đã giao cho đơn vị vận chuyển', 'Đang trên đường', 'Đã giao (mô phỏng)'];
const STATUS = ['Đang đóng gói…', 'Đã giao cho đơn vị vận chuyển…', 'Đang trên đường…', 'Đã giao — kết thúc mô phỏng.'];
const LAST_STEP = STEPS.length - 1;

const DemoBanner = () => <div className="demo-banner">Mô phỏng — Không có giao dịch thật</div>;

type Phase = { kind: 'review' } | { kind: 'processing' } | { kind: 'confirmed'; order: string };

/** Đặt hàng mô phỏng: không thu thập địa chỉ hay thanh toán. */
export function CheckoutDialog({ cube }: { cube: Cube }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'review' });

  useEffect(() => {
    if (phase.kind !== 'processing') return;
    const t = window.setTimeout(
      () => setPhase({ kind: 'confirmed', order: 'DEMO-' + Date.now().toString(36).toUpperCase() }),
      CONFIRM_DELAY_MS,
    );
    return () => window.clearTimeout(t);
  }, [phase.kind]);

  if (phase.kind === 'confirmed') return <DeliveryTracker cube={cube} order={phase.order} />;

  const processing = phase.kind === 'processing';
  return (
    <>
      <DemoBanner />
      <small>CUBE CLUB / DEMO CHECKOUT</small>
      <h2>
        Một vòng xoay
        <br />
        đến tay bạn.
      </h2>
      <div className="checkout-product">
        <CubeArt type={cube.type} />
        <div>
          <h3>{cube.name}</h3>
          <p>{money(cube.price_fake)} · giá demo</p>
        </div>
      </div>
      <p>Đơn hàng mô phỏng được tạo tự động. Không cần địa chỉ hay thông tin thanh toán.</p>
      <button
        id="confirm-demo"
        className="button primary"
        disabled={processing}
        onClick={() => setPhase({ kind: 'processing' })}
      >
        {processing ? 'Đang tạo đơn mô phỏng…' : 'Xác nhận đặt hàng (Demo)'}
      </button>
    </>
  );
}

function DeliveryTracker({ cube, order }: { cube: Cube; order: string }) {
  const modal = useModal();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= LAST_STEP) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), STEP_INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [step]);

  return (
    <>
      <DemoBanner />
      <small>{order}</small>
      <h2>Đơn demo đã được xác nhận!</h2>
      <p>{cube.name} · không phát sinh giao dịch hay giao hàng.</p>
      <svg
        className="delivery"
        viewBox="0 0 500 180"
        role="img"
        aria-label="Hộp hàng mô phỏng di chuyển từ kho tới nhà"
      >
        <path d="M55 130 Q250 -30 445 130" fill="none" stroke="#a59abb" strokeWidth="3" strokeDasharray="7 9" />
        <text x="30" y="170" fontSize="16">
          KHO
        </text>
        <text x="420" y="170" fontSize="16">
          NHÀ
        </text>
        <g className="parcel">
          <rect x="-17" y="-17" width="34" height="34" rx="5" fill="#ffcf61" stroke="#292339" strokeWidth="2" />
          <path d="M0 -17V17M-17 -5H17" stroke="#292339" strokeWidth="2" />
        </g>
      </svg>
      <ol className="delivery-steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i <= step ? 'done' : ''}>
            {s}
          </li>
        ))}
      </ol>
      <p className="delivery-status" role="status">
        {STATUS[step]}
      </p>
      <button className="button secondary" onClick={modal.close}>
        Tiếp tục khám phá
      </button>
    </>
  );
}
