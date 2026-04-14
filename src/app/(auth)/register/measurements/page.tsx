'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Title, Text } from 'rizzui';
import toast from 'react-hot-toast';
import axios from 'axios';
import { PiCaretDownBold } from 'react-icons/pi';

/* ── Types ── */
type BodyZone =
  | 'full'
  | 'head'
  | 'bust'
  | 'waist'
  | 'hip'
  | 'legs'
  | 'ankle'
  | 'knee'
  | 'foot'
  | null;

const FIELD_ZONE_MAP: Record<string, BodyZone> = {
  height: 'full',
  weight: 'full',
  hairColour: 'head',
  highBust: 'bust',
  fullBust: 'bust',
  waist: 'waist',
  highHip: 'hip',
  fullHip: 'hip',
  ankleToHip: 'legs',
  ankleToKnee: 'legs',
  ankleGirth: 'ankle',
  kneeGirth: 'knee',
  inseam: 'legs',
  shoeSize: 'foot',
};

// Hair colors from API (GetListByTypeName typeName=HairColor)
const HAIR_COLOURS: { id: number; name: string }[] = [
  { id: 2, name: 'Black' },
  { id: 16, name: 'BROWNish' },
  { id: 5, name: 'Brown' },
  { id: 6, name: 'Blond' },
  { id: 17, name: 'Red-BROWN' },
  { id: 7, name: 'Dark blond' },
  { id: 8, name: 'Medium brown' },
  { id: 9, name: 'Dark brown' },
  { id: 10, name: 'Auburn' },
  { id: 11, name: 'Red' },
  { id: 12, name: 'Gray' },
  { id: 13, name: 'White' },
  { id: 15, name: 'BA' },
  { id: 14, name: 'Cherry Cola EDIT' },
];

/* ── Body Silhouette — uses original SVGs from iOS/Android app ── */
const ZONE_SVG_MAP: Record<string, string> = {
  full: '/body-silhouette/ic_unit_male.svg',
  head: '/body-silhouette/ic_hair_color_male.svg',
  bust: '/body-silhouette/ic_high_bust_male.svg',
  waist: '/body-silhouette/ic_waist_male.svg',
  hip: '/body-silhouette/ic_high_hip_male.svg',
  legs: '/body-silhouette/ic_ankle_to_hip_male.svg',
  knee: '/body-silhouette/ic_knee_girth_male.svg',
  ankle: '/body-silhouette/ic_ankle_girth_male.svg',
  foot: '/body-silhouette/ic_shoe_size_male.svg',
};

function BodySilhouette({ activeZone }: { activeZone: BodyZone }) {
  const src = ZONE_SVG_MAP[activeZone || 'full'] || ZONE_SVG_MAP.full;

  return (
    <div className="relative h-full w-full" style={{ maxHeight: '460px' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Body silhouette"
        className="h-full w-full object-contain transition-opacity duration-300"
        style={{ minHeight: '300px' }}
      />
    </div>
  );
}

/* ── Custom Dropdown (supports string[] or {id,name}[]) ── */
function Dropdown({
  value,
  onChange,
  placeholder,
  options,
  onOpen,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[] | { id: number | string; name: string }[];
  onOpen?: () => void;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onClose?.();
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // Normalize options to { key, label, val }
  const items = options.map((o) =>
    typeof o === 'string'
      ? { key: o, label: o, val: o }
      : { key: String(o.id), label: o.name, val: String(o.id) }
  );
  const selectedLabel = items.find((i) => i.val === value)?.label || '';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) onOpen?.();
          else onClose?.();
        }}
        className={`flex w-full items-center justify-between rounded-xl border bg-gray-50 px-4 py-3 text-left text-[15px] transition-colors ${
          open
            ? 'border-[#F26B50] ring-1 ring-[#F26B50]'
            : 'border-gray-200'
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {selectedLabel || placeholder}
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
          <PiCaretDownBold
            className={`h-3.5 w-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                onChange(item.val);
                setOpen(false);
                onClose?.();
              }}
              className={`block w-full px-4 py-3 text-left text-[15px] transition-colors hover:bg-gray-50 ${
                item.val === value
                  ? 'font-semibold text-[#F26B50]'
                  : 'text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Measurement Input ── */
function MeasureInput({
  field,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
}: {
  field: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onFocus: (field: string) => void;
  onBlur: () => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => onFocus(field)}
      onBlur={onBlur}
      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#F26B50] focus:ring-1 focus:ring-[#F26B50]"
    />
  );
}

/* ── Page ── */
export default function MeasurementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeZone, setActiveZone] = useState<BodyZone>(null);

  // Unit
  const [unit, setUnit] = useState('');

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_token') || ''
      : '';

  // Hair colors (loaded from API)
  const [hairColors, setHairColors] = useState(HAIR_COLOURS);

  // Load hair colors from API
  useEffect(() => {
    async function loadHairColors() {
      try {
        const res = await axios.post('/api/user', {
          endpoint: 'GetListByTypeName',
          token,
          data: { typeName: 'HairColor' },
        });
        const rd = res.data?.responseData;
        if (Array.isArray(rd) && rd.length > 0) {
          setHairColors(
            rd.map((c: { Value: number; Name: string }) => ({
              id: c.Value,
              name: c.Name.trim(),
            }))
          );
        }
      } catch {
        /* fallback to static */
      }
    }
    loadHairColors();
  }, [token]);

  // Measurements
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [hairColour, setHairColour] = useState('');
  const [highBust, setHighBust] = useState('');
  const [fullBust, setFullBust] = useState('');
  const [waist, setWaist] = useState('');
  const [highHip, setHighHip] = useState('');
  const [fullHip, setFullHip] = useState('');
  const [ankleToHip, setAnkleToHip] = useState('');
  const [ankleToKnee, setAnkleToKnee] = useState('');
  const [ankleGirth, setAnkleGirth] = useState('');
  const [kneeGirth, setKneeGirth] = useState('');
  const [inseam, setInseam] = useState('');
  const [shoeSize, setShoeSize] = useState('');

  const handleFocus = (field: string) => {
    setActiveZone(FIELD_ZONE_MAP[field] || null);
  };
  const handleBlur = () => setActiveZone(null);

  async function handleContinue() {
    setLoading(true);
    try {
      const payload = {
        userMeasuredUnit: unit || 'cm',
        height: height || null,
        weight: weight || null,
        hairColorId: hairColour ? Number(hairColour) : null,
        highBust: highBust || null,
        fullBust: fullBust || null,
        waist: waist || null,
        highHip: highHip || null,
        fullHip: fullHip || null,
        ankleToHip: ankleToHip || null,
        ankleToKnee: ankleToKnee || null,
        ankleGirth: ankleGirth || null,
        kneeGirth: kneeGirth || null,
        inseam: inseam || null,
        showSize: shoeSize || null,
      };

      const userType =
        typeof window !== 'undefined'
          ? localStorage.getItem('su_register_userType') || 'IndividualUser'
          : 'IndividualUser';

      // Measurements go in Registration step 4
      const endpoint =
        userType === 'CompanyUser'
          ? 'CompanyRegistration4'
          : 'IndividualRegistration4';

      const res = await axios.post('/api/user', {
        endpoint,
        token,
        data: payload,
      });

      const data = res.data;
      if (data.responseCode === '1' || data.responseCode === '200') {
        toast.success('Measurements saved');
        router.push('/register/gallery');
      } else {
        toast.error(
          data.responseMessage || 'Failed to save. Please try again.'
        );
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-4 py-6">
      {/* Top nav — same style as other registration steps */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/signin">
          <img
            src="/logo-showunited.png"
            alt="Show United"
            className="h-10 w-auto"
          />
        </Link>
        <Text as="span" className="text-nowrap font-medium text-gray-500">
          Step 6 of 7
        </Text>
      </div>

      <div className="mx-auto w-full max-w-sm md:max-w-lg">
        <Title as="h3" className="mb-4 font-inter text-xl font-medium md:text-2xl">
          Size charts
        </Title>

        {/* Unit selector */}
        <div className="mb-4">
          <Dropdown
            value={unit}
            onChange={setUnit}
            placeholder="Select Centimeters or Inch"
            options={['Centimeters', 'Inches']}
            onOpen={() => {}}
            onClose={() => {}}
          />
        </div>

        {/* Body + Fields layout */}
        <div className="flex gap-3">
          {/* Silhouette — sticky while scrolling fields */}
          <div className="sticky top-6 w-[35%] shrink-0 self-start">
            <BodySilhouette activeZone={activeZone} />
          </div>

          {/* Fields */}
          <div className="flex flex-1 flex-col gap-3">
          <MeasureInput
            field="height"
            placeholder="Height"
            value={height}
            onChange={setHeight}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <MeasureInput
            field="weight"
            placeholder="Weight"
            value={weight}
            onChange={setWeight}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          {/* Hair Colour dropdown — IDs from API */}
          <Dropdown
            value={hairColour}
            onChange={setHairColour}
            placeholder="Colour of Hair"
            options={hairColors}
            onOpen={() => setActiveZone('head')}
            onClose={() => setActiveZone(null)}
          />

          <MeasureInput
            field="highBust"
            placeholder="High Bust"
            value={highBust}
            onChange={setHighBust}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <MeasureInput
            field="fullBust"
            placeholder="Full Bust"
            value={fullBust}
            onChange={setFullBust}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <MeasureInput
            field="waist"
            placeholder="Waist"
            value={waist}
            onChange={setWaist}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <MeasureInput
            field="highHip"
            placeholder="High Hip"
            value={highHip}
            onChange={setHighHip}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <MeasureInput
            field="fullHip"
            placeholder="Full Hip"
            value={fullHip}
            onChange={setFullHip}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <MeasureInput
            field="ankleToHip"
            placeholder="Ankle to Hip"
            value={ankleToHip}
            onChange={setAnkleToHip}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <MeasureInput
            field="ankleToKnee"
            placeholder="Ankle to Knee"
            value={ankleToKnee}
            onChange={setAnkleToKnee}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <MeasureInput
            field="ankleGirth"
            placeholder="Ankle Girth"
            value={ankleGirth}
            onChange={setAnkleGirth}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <MeasureInput
            field="kneeGirth"
            placeholder="Knee Girth"
            value={kneeGirth}
            onChange={setKneeGirth}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <MeasureInput
            field="inseam"
            placeholder="Inseam"
            value={inseam}
            onChange={setInseam}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <MeasureInput
            field="shoeSize"
            placeholder="Shoe Size"
            value={shoeSize}
            onChange={setShoeSize}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          </div>{/* end fields column */}
        </div>{/* end body + fields flex */}

        {/* Bottom button */}
        <div className="mt-8">
          <Button
            onClick={handleContinue}
            isLoading={loading}
            className="w-full"
            size="lg"
          >
            Continue
          </Button>
          <button
            onClick={() => router.push('/register/gallery')}
            className="mt-3 block w-full text-center text-sm text-gray-400 hover:text-gray-600"
          >
            Skip for now
          </button>
        </div>
      </div>{/* end max-w wrapper */}
    </div>
  );
}
