// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
import { View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'

function BaseSvg({ size = 16, strokeWidth = 2, children, ...props }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </Svg>
  )
}

export function UserIcon(props) {
  return (
    <BaseSvg {...props}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </BaseSvg>
  )
}

export function MailIcon(props) {
  return (
    <BaseSvg {...props}>
      <Rect x="3" y="5" width="18" height="14" rx="3" />
      <Path d="m4 7 8 6 8-6" />
    </BaseSvg>
  )
}

export function PhoneIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M6.6 3.5h2.2l1.6 4.2-2.1 1.4a11 11 0 0 0 6.6 6.6l1.4-2.1 4.2 1.6v2.2a2.2 2.2 0 0 1-2.4 2.2A16.8 16.8 0 0 1 4.4 5.9a2.2 2.2 0 0 1 2.2-2.4Z" />
    </BaseSvg>
  )
}

export function LockIcon(props) {
  return (
    <BaseSvg {...props}>
      <Rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
      <Path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </BaseSvg>
  )
}

export function EyeIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <Circle cx="12" cy="12" r="3" />
    </BaseSvg>
  )
}

export function EyeOffIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.6 6.6C3.9 8.3 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9 9 0 0 0 5.4-1.6" />
      <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <Path d="m3 3 18 18" />
    </BaseSvg>
  )
}

export function CheckIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="m5 12.5 4.5 4.5L19 7.5" />
    </BaseSvg>
  )
}

export function ArrowRightIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M4 12h16" />
      <Path d="m13 5 7 7-7 7" />
    </BaseSvg>
  )
}

export function ArrowLeftIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M20 12H4" />
      <Path d="m11 5-7 7 7 7" />
    </BaseSvg>
  )
}

export function SearchIcon(props) {
  return (
    <BaseSvg {...props}>
      <Circle cx="11" cy="11" r="7" />
      <Path d="m20 20-3.5-3.5" />
    </BaseSvg>
  )
}

export function LogoutIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <Path d="M10 17l-5-5 5-5" />
      <Path d="M5 12h11" />
    </BaseSvg>
  )
}

export function MenuIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M4 7h16M4 12h16M4 17h16" />
    </BaseSvg>
  )
}

export function CloseIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M6 6l12 12M18 6 6 18" />
    </BaseSvg>
  )
}

export function AlertIcon(props) {
  return (
    <BaseSvg {...props}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7.5v5.5" />
      <Path d="M12 16.5h.01" />
    </BaseSvg>
  )
}

/** Pata inclinada do fundo das telas de acesso (traçado original do protótipo). */
export function PawFilled({ size, ...props }) {
  return (
    <Svg viewBox="6 5 154 192" fill="currentColor" height={size ? (size * 192) / 154 : undefined} width={size} {...props}>
      <Path d="M51.4 18.8C59.6 16.4 67.9 21.2 69.9 29.5L75 50.4C77.1 58.7 72 67.4 63.8 69.9C55.6 72.3 47.3 67.5 45.3 59.2L40.2 38.2C38.2 29.9 43.2 21.2 51.4 18.8Z" />
      <Path d="M82.9 66.4C113.7 57.4 144.8 75.3 152.4 106.5L154.8 116.1C162.4 147.3 143.6 179.9 112.8 189C82 198 50.9 180.1 43.3 148.9L40.9 139.3C33.3 108.1 52.1 75.5 82.9 66.4Z" />
      <Path d="M133 18.8C141.2 16.4 149.5 21.2 151.6 29.5L156.7 50.5C158.7 58.8 153.7 67.5 145.5 69.9C137.3 72.3 129 67.5 126.9 59.2L121.8 38.3C119.8 30 124.8 21.3 133 18.8Z" />
      <Path d="M79.2 26.7C77.2 18.4 82.2 9.7 90.4 7.3C98.6 4.9 106.9 9.7 109 18L114.1 38.9C116.1 47.2 111.1 55.9 102.9 58.4C94.7 60.8 86.4 56 84.3 47.7L79.2 26.7Z" />
      <Path d="M19.7 52.2C27.9 49.8 36.2 54.6 38.2 62.9L43.3 83.8C45.4 92.2 40.3 100.9 32.1 103.3C23.9 105.7 15.6 100.9 13.6 92.6L8.5 71.7C6.5 63.3 11.5 54.6 19.7 52.2Z" />
    </Svg>
  )
}

/** Pata do painel do login (traçado original do protótipo). */
export function PawPanel(props) {
  return (
    <Svg viewBox="2 1.7 38.1 41" fill="currentColor" {...props}>
      <Path d="M16.1 1.7C18.3 1.7 20.1 3.5 20.1 5.7V9.7C20.1 11.9 18.3 13.7 16.1 13.7C13.9 13.7 12.1 11.9 12.1 9.7V5.7C12.1 3.5 13.9 1.7 16.1 1.7Z" />
      <Path d="M26.1 1.7C28.3 1.7 30.1 3.5 30.1 5.7V9.7C30.1 11.9 28.3 13.7 26.1 13.7C23.9 13.7 22.1 11.9 22.1 9.7V5.7C22.1 3.5 23.9 1.7 26.1 1.7Z" />
      <Path d="M6.1 6.7C8.3 6.7 10.1 8.5 10.1 10.7V14.7C10.1 16.9 8.3 18.7 6.1 18.7C3.9 18.7 2.1 16.9 2.1 14.7V10.7C2.1 8.5 3.9 6.7 6.1 6.7Z" />
      <Path d="M36.1 6.7C38.3 6.7 40.1 8.5 40.1 10.7V14.7C40.1 16.9 38.3 18.7 36.1 18.7C33.9 18.7 32.1 16.9 32.1 14.7V10.7C32.1 8.5 33.9 6.7 36.1 6.7Z" />
      <Circle cx="20.1" cy="28.7" r="14" />
    </Svg>
  )
}

/** Pata em contorno com três pontos (decoração da Home). */
export function PawOutline({ size, ...props }) {
  return (
    <Svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      {...props}
    >
      <Path
        strokeWidth="2.2"
        d="M8.5 19.5c-3 0-5 2.6-4.3 5.3.6 2.3 2.8 3 4.6 3.9 1.6.8 2.1 2.6 3.2 3.9 1.4 1.6 4.1 1.5 5.2-.4.9-1.6.6-3.6-.2-5.2-1.4-2.9-3.9-7.5-8.5-7.5Z"
      />
      <Circle cx="17" cy="6.5" r="2.4" strokeWidth="2" />
      <Circle cx="26" cy="12.5" r="2.4" strokeWidth="2" />
      <Circle cx="29" cy="22.5" r="2.4" strokeWidth="2" />
    </Svg>
  )
}

export function ChevronLeftIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="m15 5-7 7 7 7" />
    </BaseSvg>
  )
}

export function ChevronRightIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="m9 5 7 7-7 7" />
    </BaseSvg>
  )
}

export function ChevronDownIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="m6 9 6 6 6-6" />
    </BaseSvg>
  )
}

export function PlusIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M12 5v14M5 12h14" />
    </BaseSvg>
  )
}

export function StethoscopeIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M5 3v5a5 5 0 0 0 10 0V3" />
      <Path d="M10 13v2a5 5 0 0 0 10 0v-1" />
      <Circle cx="20" cy="12" r="2" />
    </BaseSvg>
  )
}

export function ScissorsIcon(props) {
  return (
    <BaseSvg {...props}>
      <Circle cx="6" cy="6" r="3" />
      <Circle cx="6" cy="18" r="3" />
      <Path d="M8.1 8.1 20 20M8.1 15.9 20 4" />
    </BaseSvg>
  )
}

export function ShieldCheckIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6L12 3Z" />
      <Path d="m8.8 12.2 2.2 2.2 4.2-4.4" />
    </BaseSvg>
  )
}

export function SparkleIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z" />
      <Circle cx="5" cy="19" r="1" />
    </BaseSvg>
  )
}

export function HouseIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.5Z" />
      <Path d="M9.5 20.5V14h5v6.5" />
    </BaseSvg>
  )
}

export function ClockIcon(props) {
  return (
    <BaseSvg {...props}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </BaseSvg>
  )
}

export function ChipIcon(props) {
  return (
    <BaseSvg {...props}>
      <Rect x="6" y="6" width="12" height="12" rx="2" />
      <Rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <Path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5" />
    </BaseSvg>
  )
}

export function InfoIcon(props) {
  return (
    <BaseSvg {...props}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 11v5.5" />
      <Path d="M12 7.5h.01" />
    </BaseSvg>
  )
}

export function HeartIcon({ filled = false, ...props }) {
  return (
    <BaseSvg {...props} fill={filled ? 'currentColor' : 'none'}>
      <Path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />
    </BaseSvg>
  )
}

export function MapPinIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <Circle cx="12" cy="10" r="2.5" />
    </BaseSvg>
  )
}

export function CameraIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.6-2.2h5.4L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
      <Circle cx="12" cy="13" r="3.2" />
    </BaseSvg>
  )
}

export function UploadIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
      <Path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    </BaseSvg>
  )
}

export function CalendarIcon(props) {
  return (
    <BaseSvg {...props}>
      <Rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <Path d="M3.5 10h17M8 3v4M16 3v4" />
    </BaseSvg>
  )
}

export function TrashIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M4.5 7h15M10 11v6M14 11v6" />
      <Path d="M6 7l.9 12a1.5 1.5 0 0 0 1.5 1.4h7.2a1.5 1.5 0 0 0 1.5-1.4L18 7" />
      <Path d="M9 7V4.5h6V7" />
    </BaseSvg>
  )
}

export function PillIcon(props) {
  return (
    <BaseSvg {...props}>
      <Rect x="2.8" y="8.2" width="18.4" height="7.6" rx="3.8" transform="rotate(-45 12 12)" />
      <Path d="m8.6 8.6 6.8 6.8" />
    </BaseSvg>
  )
}

export function BowlIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M3 11h18a9 9 0 0 1-18 0Z" />
      <Path d="M8 7.5c.6-1 1.6-1.5 2.5-1.5M13 6c.9 0 1.9.5 2.5 1.5" />
      <Path d="M7 20h10" />
    </BaseSvg>
  )
}

export function CalculatorIcon(props) {
  return (
    <BaseSvg {...props}>
      <Rect x="5" y="2.5" width="14" height="19" rx="2.5" />
      <Path d="M8 6.5h8v3H8z" />
      <Path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 17h.01M12 17h.01M15.5 17h.01" />
    </BaseSvg>
  )
}

export function DownloadIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5" />
      <Path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" />
    </BaseSvg>
  )
}

export function PencilIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M15.5 4.5 19.5 8.5 8.5 19.5H4.5v-4L15.5 4.5Z" />
      <Path d="m13.5 6.5 4 4" />
    </BaseSvg>
  )
}

export function RulerIcon(props) {
  return (
    <BaseSvg {...props}>
      <Rect x="2.6" y="8.2" width="18.8" height="7.6" rx="1.5" transform="rotate(-45 12 12)" />
      <Path d="m8.3 9.6 1.6 1.6M10.8 7.1l1.6 1.6M13.3 4.6l1.6 1.6M5.8 12.1l1.6 1.6" />
    </BaseSvg>
  )
}

export function ArrowsVerticalIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M8 20V4M4.5 7.5 8 4l3.5 3.5M16 4v16M12.5 16.5 16 20l3.5-3.5" />
    </BaseSvg>
  )
}

export function SlidersIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M6 4v16M12 4v16M18 4v16" />
      <Path d="M4 9h4M10 15h4M16 7h4" />
    </BaseSvg>
  )
}

export function CakeIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M4 20.5h16M5 20.5v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6" />
      <Path d="M5 16c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0 2.3 1 3.5 0 2.3-1 3.5 0" />
      <Path d="M12 12.5V8.5M12 6.2c-.8-.6-.8-1.6 0-2.7.8 1.1.8 2.1 0 2.7Z" />
    </BaseSvg>
  )
}

export function GenderIcon({ sexo, ...props }) {
  if (sexo === 'Macho') {
    return (
      <BaseSvg {...props}>
        <Circle cx="10" cy="14" r="5.5" />
        <Path d="M14 10 20 4M15 4h5v5" />
      </BaseSvg>
    )
  }
  return (
    <BaseSvg {...props}>
      <Circle cx="12" cy="9" r="5.5" />
      <Path d="M12 14.5V21M9 18h6" />
    </BaseSvg>
  )
}

export function UsersIcon(props) {
  return (
    <BaseSvg {...props}>
      <Circle cx="9" cy="8" r="3.5" />
      <Path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <Path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </BaseSvg>
  )
}

export function PrinterIcon(props) {
  return (
    <BaseSvg {...props}>
      <Path d="M7 9V3.5h10V9" />
      <Rect x="3.5" y="9" width="17" height="8" rx="2" />
      <Path d="M7 14h10v6.5H7z" />
    </BaseSvg>
  )
}

export function WhatsAppIcon(props) {
  return (
    <Svg
      viewBox="0 0 24 24"
      width={props.size ?? 24}
      color={props.color}
      style={props.style}
      height={props.size ?? 24}
      fill="currentColor"
    >
      <Path d="M12 2.2a9.8 9.8 0 0 0-8.4 14.8L2.3 21.7l4.8-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.8 2c0 1.2.9 2.3 1 2.5.1.2 1.7 2.6 4.2 3.7 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z" />
    </Svg>
  )
}

/** Duas patinhas em contorno, usadas acima dos títulos das páginas internas. */
export function PawPair({ style, color }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }, style]}>
      <PawOutline width={22} height={22} color={color} />
      <PawOutline width={16} height={16} color={color} />
    </View>
  )
}
