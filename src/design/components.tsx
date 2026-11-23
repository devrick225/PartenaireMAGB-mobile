/**
 * Composants d'interface communs — équivalents React Native des composants
 * mobiles du site (frontend-new : MobileLayout, MobileSection, MobileRow,
 * MobileStatCard, hero en dégradé, badges, onglets).
 *
 * Tous les écrans refondus doivent s'appuyer sur ces composants plutôt que
 * de redéfinir couleurs, rayons et espacements.
 */
import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import {
  cardShadow,
  heroGradient,
  MIN_TOUCH,
  palette,
  Palette,
  radius,
  spacing,
  typography,
  TypographyVariant,
} from './tokens';

export type IconName = keyof typeof Ionicons.glyphMap;

// ---------------------------------------------------------------------------
// Thème
// ---------------------------------------------------------------------------

export function useDS() {
  const { dark } = useTheme() as { dark: boolean };
  const c: Palette = dark ? palette.dark : palette.light;
  return { c, dark, gradient: dark ? heroGradient.dark : heroGradient.light };
}

// ---------------------------------------------------------------------------
// Formatage
// ---------------------------------------------------------------------------

export function formatAmount(amount?: number | null, currency: string = 'XOF') {
  const value = Number(amount) || 0;
  const unit = !currency || currency === 'XOF' || currency === 'FCFA' ? 'FCFA' : currency;
  if (unit === 'USD') return `$${value.toLocaleString('fr-FR')}`;
  if (unit === 'EUR') return `${value.toLocaleString('fr-FR')} €`;
  return `${value.toLocaleString('fr-FR')} ${unit}`;
}

export function formatDate(value?: string | Date | null, withTime = false) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

// ---------------------------------------------------------------------------
// Texte
// ---------------------------------------------------------------------------

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
}

/** Texte typographié. Le grossissement système est limité pour ne pas casser les mises en page. */
export function AppText({ variant = 'body', color, center, style, ...rest }: AppTextProps) {
  const { c } = useDS();
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[typography[variant], { color: color ?? c.foreground }, center && { textAlign: 'center' }, style]}
    />
  );
}

// ---------------------------------------------------------------------------
// Structure d'écran
// ---------------------------------------------------------------------------

interface ScreenProps extends ScrollViewProps {
  children: ReactNode;
  /** Hero affiché en haut, hors du contenu (les cartes le chevauchent légèrement) */
  hero?: ReactNode;
  /** Élément fixé en bas (ex. bouton principal), au-dessus de la zone sûre */
  footer?: ReactNode;
  scroll?: boolean;
}

export function Screen({ children, hero, footer, scroll = true, contentContainerStyle, ...rest }: ScreenProps) {
  const { c } = useDS();
  const insets = useSafeAreaInsets();
  const body = (
    <View style={[styles.body, hero ? styles.bodyUnderHero : { paddingTop: insets.top + spacing.lg }]}>{children}</View>
  );
  return (
    <View style={[styles.flex, { backgroundColor: c.background }]}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[{ paddingBottom: footer ? spacing.lg : insets.bottom + spacing.xl }, contentContainerStyle]}
          {...rest}
        >
          {hero}
          {body}
        </ScrollView>
      ) : (
        <View style={styles.flex}>
          {hero}
          {body}
        </View>
      )}
      {footer ? (
        <View
          style={[
            styles.footer,
            { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

interface HeroHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  eyebrowIcon?: IconName;
  onBack?: () => void;
  right?: ReactNode;
  children?: ReactNode;
}

/** En-tête en dégradé violet (hero du site). Gère la zone sûre du haut. */
export function HeroHeader({ title, subtitle, eyebrow, eyebrowIcon, onBack, right, children }: HeroHeaderProps) {
  const { c, gradient } = useDS();
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradient as unknown as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
    >
      {(onBack || right) && (
        <View style={styles.heroTopBar}>
          {onBack ? (
            <IconButton icon="chevron-back" onPress={onBack} accessibilityLabel="Retour" tone="hero" />
          ) : (
            <View style={{ width: MIN_TOUCH }} />
          )}
          {right ?? <View style={{ width: MIN_TOUCH }} />}
        </View>
      )}
      {eyebrow ? (
        <View style={styles.row}>
          {eyebrowIcon ? <Ionicons name={eyebrowIcon} size={16} color={c.heroTextMuted} style={{ marginRight: 6 }} /> : null}
          <AppText variant="small" color={c.heroTextMuted}>
            {eyebrow}
          </AppText>
        </View>
      ) : null}
      <AppText variant="display" color={c.heroText} accessibilityRole="header" style={{ marginTop: 2 }}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="small" color={c.heroTextMuted} style={{ marginTop: 4 }}>
          {subtitle}
        </AppText>
      ) : null}
      {children ? <View style={{ marginTop: spacing.md }}>{children}</View> : null}
    </LinearGradient>
  );
}

/** Pastille translucide sur le hero (ex. « Niveau Or », « 3 en attente ») */
export function HeroChip({ icon, label }: { icon?: IconName; label: string }) {
  const { c } = useDS();
  return (
    <View style={[styles.heroChip, { backgroundColor: c.heroChip }]}>
      {icon ? <Ionicons name={icon} size={13} color={c.gold} style={{ marginRight: 5 }} /> : null}
      <AppText variant="caption" color={c.heroText}>
        {label}
      </AppText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Cartes et sections
// ---------------------------------------------------------------------------

export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  const { c } = useDS();
  return (
    <View style={[styles.card, cardShadow, { backgroundColor: c.card, borderColor: c.border }, padded && { padding: spacing.lg }, style]}>
      {children}
    </View>
  );
}

/** Groupe de lignes avec titre en petites capitales (MobileSection) */
export function Section({ title, action, children, style }: { title?: string; action?: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useDS();
  return (
    <View style={style}>
      {(title || action) && (
        <View style={styles.sectionHeader}>
          {title ? (
            <AppText variant="overline" color={c.mutedForeground} accessibilityRole="header">
              {title}
            </AppText>
          ) : (
            <View />
          )}
          {action}
        </View>
      )}
      <Card padded={false} style={{ overflow: 'hidden' }}>
        {children}
      </Card>
    </View>
  );
}

interface RowProps {
  icon?: IconName;
  label: string;
  sublabel?: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  last?: boolean;
  accessibilityLabel?: string;
}

/** Ligne de liste (MobileRow) : pastille d'icône, libellé, valeur, chevron */
export function Row({ icon, label, sublabel, value, right, onPress, chevron, destructive, last, accessibilityLabel }: RowProps) {
  const { c } = useDS();
  const tint = destructive ? c.destructive : c.primary;
  const content = (
    <>
      {icon ? (
        <View style={[styles.iconTile, { backgroundColor: destructive ? c.destructiveSoft : c.primarySoft }]}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <AppText variant="bodyStrong" color={destructive ? c.destructive : c.foreground} numberOfLines={2}>
          {label}
        </AppText>
        {sublabel ? (
          <AppText variant="small" color={c.mutedForeground} numberOfLines={2}>
            {sublabel}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="small" color={c.mutedForeground} style={{ marginLeft: spacing.sm, flexShrink: 1, textAlign: 'right' }} numberOfLines={1}>
          {value}
        </AppText>
      ) : null}
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={destructive ? c.destructive : c.mutedForeground} style={{ marginLeft: 4 }} /> : null}
    </>
  );
  const rowStyle = [styles.row, styles.listRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }];
  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [rowStyle, pressed && { backgroundColor: c.muted }]}
    >
      {content}
    </Pressable>
  );
}

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

function toneColors(c: Palette, tone: Tone) {
  switch (tone) {
    case 'success':
      return { fg: c.success, bg: c.successSoft };
    case 'warning':
      return { fg: c.warning, bg: c.warningSoft };
    case 'danger':
      return { fg: c.destructive, bg: c.destructiveSoft };
    case 'info':
      return { fg: c.info, bg: c.infoSoft };
    case 'neutral':
      return { fg: c.mutedForeground, bg: c.muted };
    default:
      return { fg: c.primary, bg: c.primarySoft };
  }
}

/** Carte de statistique (MobileStatCard). `tinted` reproduit les petites cartes colorées Réussis/En attente/Échoués. */
export function StatCard({ icon, label, value, unit, tone = 'primary', tinted, style }: { icon?: IconName; label: string; value: string | number; unit?: string; tone?: Tone; tinted?: boolean; style?: StyleProp<ViewStyle> }) {
  const { c } = useDS();
  const t = toneColors(c, tone);
  if (tinted) {
    return (
      <View style={[styles.tintedStat, { backgroundColor: t.bg }, style]} accessible accessibilityLabel={`${label} : ${value}`}>
        {icon ? <Ionicons name={icon} size={20} color={t.fg} /> : null}
        <AppText variant="subtitle" color={t.fg} style={{ marginTop: 2 }}>
          {value}
        </AppText>
        <AppText variant="caption" color={t.fg} numberOfLines={1}>
          {label}
        </AppText>
      </View>
    );
  }
  return (
    <Card style={[styles.flex, style]}>
      <View accessible accessibilityLabel={`${label} : ${value}${unit ? ' ' + unit : ''}`}>
        <AppText variant="caption" color={c.mutedForeground}>
          {label}
        </AppText>
        <AppText variant="amount" color={tone === 'primary' ? c.primary : t.fg} numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 4 }}>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="caption" color={c.mutedForeground}>
            {unit}
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Statuts
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, { label: string; tone: Tone; icon: IconName }> = {
  completed: { label: 'Payé', tone: 'success', icon: 'checkmark-circle' },
  success: { label: 'Payé', tone: 'success', icon: 'checkmark-circle' },
  paid: { label: 'Payé', tone: 'success', icon: 'checkmark-circle' },
  pending: { label: 'En attente', tone: 'warning', icon: 'time' },
  processing: { label: 'En cours', tone: 'info', icon: 'sync' },
  scheduled: { label: 'Planifié', tone: 'info', icon: 'calendar' },
  failed: { label: 'Échoué', tone: 'danger', icon: 'close-circle' },
  expired: { label: 'Expiré', tone: 'danger', icon: 'close-circle' },
  cancelled: { label: 'Annulé', tone: 'neutral', icon: 'remove-circle' },
  refunded: { label: 'Remboursé', tone: 'info', icon: 'return-down-back' },
  active: { label: 'Actif', tone: 'success', icon: 'checkmark-circle' },
  paused: { label: 'En pause', tone: 'neutral', icon: 'pause-circle' },
};

export function statusInfo(status?: string) {
  return STATUS_MAP[status ?? ''] ?? { label: status || 'Inconnu', tone: 'neutral' as Tone, icon: 'help-circle' as IconName };
}

export function Badge({ label, tone = 'primary', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const { c } = useDS();
  const t = toneColors(c, tone);
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {icon ? <Ionicons name={icon} size={12} color={t.fg} style={{ marginRight: 4 }} /> : null}
      <AppText variant="caption" color={t.fg} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  const s = statusInfo(status);
  return <Badge label={s.label} tone={s.tone} icon={s.icon} />;
}

// ---------------------------------------------------------------------------
// Boutons et champs
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'gold' | 'outline' | 'ghost' | 'destructive';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, fullWidth = true, style, accessibilityHint }: ButtonProps) {
  const { c } = useDS();
  const v = {
    primary: { bg: c.primary, fg: c.primaryForeground, border: c.primary },
    gold: { bg: c.gold, fg: c.onGold, border: c.gold },
    outline: { bg: 'transparent', fg: c.primary, border: c.border },
    ghost: { bg: 'transparent', fg: c.primary, border: 'transparent' },
    destructive: { bg: c.destructive, fg: '#FFFFFF', border: c.destructive },
  }[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={v.fg} style={{ marginRight: 8 }} /> : null}
          <AppText variant="bodyStrong" color={v.fg} numberOfLines={1}>
            {title}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, accessibilityLabel, tone = 'default', badge }: { icon: IconName; onPress?: () => void; accessibilityLabel: string; tone?: 'default' | 'hero'; badge?: number }) {
  const { c } = useDS();
  const color = tone === 'hero' ? c.heroText : c.foreground;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: tone === 'hero' ? c.heroChip : c.muted, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icon} size={22} color={color} />
      {badge ? (
        <View style={[styles.iconBadge, { backgroundColor: c.gold }]}>
          <AppText variant="caption" color={c.onGold} style={{ fontSize: 10, lineHeight: 12 }}>
            {badge > 99 ? '99+' : badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: IconName;
  suffix?: string;
  /** Élément à droite du champ (ex. bouton afficher/masquer le mot de passe) */
  right?: ReactNode;
  /** Référence vers le TextInput (pour enchaîner les champs avec focus()) */
  inputRef?: React.Ref<any>;
}

export function TextField({ label, error, hint, icon, suffix, right, inputRef, style, ...rest }: TextFieldProps) {
  const { c } = useDS();
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <AppText variant="smallStrong" color={c.foreground}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.input,
          {
            backgroundColor: c.card,
            borderColor: error ? c.destructive : focused ? c.primary : c.input,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={c.mutedForeground} style={{ marginRight: 8 }} /> : null}
        <TextInput
          ref={inputRef}
          placeholderTextColor={c.mutedForeground}
          maxFontSizeMultiplier={1.4}
          accessibilityLabel={label}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.inputText, typography.body, { color: c.foreground }, style]}
        />
        {suffix ? (
          <AppText variant="bodyStrong" color={c.mutedForeground} style={{ marginLeft: 8 }}>
            {suffix}
          </AppText>
        ) : null}
        {right}
      </View>
      {error ? (
        <AppText variant="small" color={c.destructive} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="small" color={c.mutedForeground}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Onglets, choix, états
// ---------------------------------------------------------------------------

/** Onglets segmentés (Historique / Nouveau don du site) */
export function SegmentedTabs<T extends string>({ options, value, onChange }: { options: { key: T; label: string; icon?: IconName }[]; value: T; onChange: (key: T) => void }) {
  const { c } = useDS();
  return (
    <Card padded={false} style={[styles.row, { padding: 4 }]}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && { backgroundColor: c.primary }]}
          >
            {o.icon ? <Ionicons name={o.icon} size={16} color={active ? c.primaryForeground : c.mutedForeground} style={{ marginRight: 6 }} /> : null}
            <AppText variant="smallStrong" color={active ? c.primaryForeground : c.mutedForeground} numberOfLines={1}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </Card>
  );
}

/** Option sélectionnable (type de don, moyen de paiement…) */
export function ChoiceCard({ icon, title, description, selected, onPress }: { icon?: IconName; title: string; description?: string; selected: boolean; onPress: () => void }) {
  const { c } = useDS();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={description ? `${title}, ${description}` : title}
      style={({ pressed }) => [
        styles.choice,
        { backgroundColor: selected ? c.primarySoft : c.card, borderColor: selected ? c.primary : c.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {icon ? (
        <View style={[styles.iconTile, { backgroundColor: selected ? c.primary : c.primarySoft }]}>
          <Ionicons name={icon} size={18} color={selected ? c.primaryForeground : c.primary} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{title}</AppText>
        {description ? (
          <AppText variant="small" color={c.mutedForeground}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? c.primary : c.mutedForeground} />
    </Pressable>
  );
}

export function EmptyState({ icon = 'heart-outline', title, message, action }: { icon?: IconName; title: string; message?: string; action?: ReactNode }) {
  const { c } = useDS();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: c.primarySoft }]}>
        <Ionicons name={icon} size={30} color={c.primary} />
      </View>
      <AppText variant="subtitle" center>
        {title}
      </AppText>
      {message ? (
        <AppText variant="small" color={c.mutedForeground} center>
          {message}
        </AppText>
      ) : null}
      {action ? <View style={{ marginTop: spacing.sm, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export function LoadingState({ message = 'Chargement…' }: { message?: string }) {
  const { c } = useDS();
  return (
    <View style={styles.empty} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={c.primary} />
      <AppText variant="small" color={c.mutedForeground} center>
        {message}
      </AppText>
    </View>
  );
}

/** Fenêtre qui monte du bas (choix, confirmations) — remplace les anciennes modales plein écran */
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const { c } = useDS();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={[styles.sheetOverlay, { backgroundColor: c.overlay }]} onPress={onClose} accessibilityLabel="Fermer">
        <Pressable style={[styles.sheet, { backgroundColor: c.card, paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm }]}>
          <View style={[styles.sheetGrabber, { backgroundColor: c.border }]} />
          <View style={styles.sheetHeader}>
            <AppText variant="title" accessibilityRole="header" style={{ flex: 1 }}>
              {title}
            </AppText>
            <IconButton icon="close" onPress={onClose} accessibilityLabel="Fermer" />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Gabarit des écrans d'authentification (mot de passe oublié, réinitialisation…) :
 * en-tête de marque en dégradé + contenu en carte qui le chevauche.
 */
export function AuthScreen({ title, subtitle, icon, onBack, children, footer }: { title: string; subtitle?: string; icon?: IconName; onBack?: () => void; children: ReactNode; footer?: ReactNode }) {
  const { c, gradient } = useDS();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <LinearGradient
          colors={gradient as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl + spacing.lg }}
        >
          {onBack ? <IconButton icon="chevron-back" tone="hero" onPress={onBack} accessibilityLabel="Retour" /> : <View style={{ height: MIN_TOUCH }} />}
          {icon ? (
            <View style={styles.authIcon}>
              <Ionicons name={icon} size={30} color={c.gold} />
            </View>
          ) : null}
          <AppText variant="display" color={c.heroText} accessibilityRole="header" style={{ marginTop: spacing.md }}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="body" color={c.heroTextMuted} style={{ marginTop: 4 }}>
              {subtitle}
            </AppText>
          ) : null}
        </LinearGradient>
        <View style={{ paddingHorizontal: spacing.lg, marginTop: -spacing.xl, gap: spacing.lg }}>
          <Card style={{ gap: spacing.lg }}>{children}</Card>
          {footer}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Saisie d'un code à usage unique (6 cases). Le premier champ accepte le code
 * complet (collage, suggestion « code reçu » d'iOS / Android).
 */
export function CodeInput({
  code,
  onChangeDigit,
  onKeyPress,
  inputRefs,
  editable = true,
  label = 'Code de vérification',
}: {
  code: string[];
  onChangeDigit: (value: string, index: number) => void;
  onKeyPress?: (key: string, index: number) => void;
  inputRefs: React.MutableRefObject<any[]>;
  editable?: boolean;
  label?: string;
}) {
  const { c } = useDS();
  return (
    <View style={styles.codeRow} accessibilityLabel={label}>
      {code.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          style={[
            styles.codeCell,
            typography.subtitle,
            { backgroundColor: c.card, borderColor: digit ? c.primary : c.input, color: c.foreground },
          ]}
          value={digit}
          onChangeText={(value) => onChangeDigit(value, index)}
          onKeyPress={({ nativeEvent }) => onKeyPress?.(nativeEvent.key, index)}
          keyboardType="number-pad"
          maxLength={index === 0 ? 6 : 1}
          textContentType={index === 0 ? 'oneTimeCode' : 'none'}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          selectTextOnFocus
          textAlign="center"
          editable={editable}
          maxFontSizeMultiplier={1.3}
          accessibilityLabel={`Chiffre ${index + 1} sur ${code.length}`}
        />
      ))}
    </View>
  );
}

/** Ligne clé / valeur pour les écrans de détail */
export function InfoRow({ label, value, last, valueColor }: { label: string; value?: ReactNode; last?: boolean; valueColor?: string }) {
  const { c } = useDS();
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
      <AppText variant="small" color={c.mutedForeground} style={{ flex: 1 }}>
        {label}
      </AppText>
      {typeof value === 'string' || typeof value === 'number' ? (
        <AppText variant="smallStrong" color={valueColor ?? c.foreground} style={{ flex: 1.4, textAlign: 'right' }} selectable>
          {value}
        </AppText>
      ) : (
        <View style={{ flex: 1.4, alignItems: 'flex-end' }}>{value ?? <AppText variant="smallStrong">—</AppText>}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  body: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  bodyUnderHero: { marginTop: -spacing.lg },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  heroTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  heroChip: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginRight: spacing.sm },
  card: { borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xs, marginBottom: 6 },
  listRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 56, gap: spacing.md },
  iconTile: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tintedStat: { flex: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  button: { minHeight: 50, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  iconBadge: { position: 'absolute', top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  input: { flexDirection: 'row', alignItems: 'center', minHeight: 50, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.md },
  inputText: { flex: 1, paddingVertical: 12 },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: MIN_TOUCH, borderRadius: radius.lg, paddingHorizontal: spacing.sm },
  choice: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.md, minHeight: 60 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg, gap: spacing.sm },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, maxHeight: '88%' },
  sheetGrabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: spacing.xs },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  authIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  codeCell: { flex: 1, maxWidth: 52, height: 56, borderWidth: 1.5, borderRadius: radius.lg, textAlign: 'center' },
});
