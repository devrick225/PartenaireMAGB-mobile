import { Alert, Linking } from 'react-native';

/**
 * Ouvre un lien externe (https, tel:, mailto:, whatsapp…) de façon fiable.
 *
 * On n'utilise pas Linking.canOpenURL : sur Android 11+, il renvoie souvent `false`
 * pour des liens https valides (visibilité des paquets), ce qui affichait
 * « Impossible d'ouvrir ce lien » à tort. On tente directement l'ouverture et on
 * affiche un message clair seulement si elle échoue (ex: pas d'app Mail installée).
 */
export async function openLink(url: string, failureMessage?: string): Promise<boolean> {
  if (!url) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch (error) {
    const defaultMessage = url.startsWith('mailto:')
      ? `Aucune application email n'est configurée. Écrivez-nous à : ${url.replace('mailto:', '').split('?')[0]}`
      : url.startsWith('tel:')
        ? `Impossible de lancer l'appel. Numéro : ${url.replace('tel:', '')}`
        : 'Impossible d\'ouvrir ce lien pour le moment.';
    Alert.alert('Lien indisponible', failureMessage || defaultMessage);
    return false;
  }
}

export default openLink;
