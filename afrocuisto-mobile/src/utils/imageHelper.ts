const IMAGE_MAP: Record<string, any> = {
  'pate_blanche_1772192522680.png': require('../../assets/images/pate_blanche_1772192522680.png'),
  'amiwo_poulet_1772192535717.png': require('../../assets/images/amiwo_poulet_1772192535717.png'),
  'agoun_igname_1772192553037.png': require('../../assets/images/agoun_igname_1772192553037.png'),
  'telibo_wo_1772192566532.png': require('../../assets/images/telibo_wo_1772192566532.png'),
  'akassa_1772192596776.png': require('../../assets/images/akassa_1772192596776.png'),
  'atassi_1772192610097.png': require('../../assets/images/atassi_1772192610097.png'),
  'ablo_1772192776472.png': require('../../assets/images/ablo_1772192776472.png'),
  'piron_blanc_1772192948416.png': require('../../assets/images/piron_blanc_1772192948416.png'),
  'kom_dokounou_1772192961914.png': require('../../assets/images/kom_dokounou_1772192961914.png'),
  'gboman_1772192977053.png': require('../../assets/images/gboman_1772192977053.png'),
  'ademe_crincrin_1772193087836.png': require('../../assets/images/ademe_crincrin_1772193087836.png'),
  'fevi_gombo_1772193101830.png': require('../../assets/images/fevi_gombo_1772193101830.png'),
  'dekoun_graine_1772193114112.png': require('../../assets/images/dekoun_graine_1772193114112.png'),
  'azin_arachide_1772193124987.png': require('../../assets/images/azin_arachide_1772193124987.png'),
  'man_tindjan_1772194012289.png': require('../../assets/images/man_tindjan_1772194012289.png'),
  'goussi_1772194027152.png': require('../../assets/images/goussi_1772194027152.png'),
  'tchiayo_1772194040696.png': require('../../assets/images/tchiayo_1772194040696.png'),
  'abobo_benin.png': require('../../assets/images/abobo_benin.png'),
  'couscous_poulet.png': require('../../assets/images/couscous_poulet.png'),
  'spaghetti_africain.png': require('../../assets/images/spaghetti_africain.png'),
  'degue.jpg': require('../../assets/images/degue.jpg'),
  'jus-de-gingembre.jpg': require('../../assets/images/jus-de-gingembre.jpg'),
  'jus-de-corossol.png': require('../../assets/images/jus-de-corossol.png'),
  'jus-de-passion.png': require('../../assets/images/jus-de-passion.png'),
  'art_pilon.jpg': require('../../assets/images/art_pilon.jpg'),
  'media__1772191119838.png': require('../../assets/images/media__1772191119838.png'),
  'media__1772191504658.png': require('../../assets/images/media__1772191504658.png'),
  'media__1772191630456.png': require('../../assets/images/media__1772191630456.png'),
  'media__1772193293946.png': require('../../assets/images/media__1772193293946.png'),
  'uploaded_media_1772188107123.png': require('../../assets/images/uploaded_media_1772188107123.png'),
};

const DEFAULT_FOOD_IMAGES = [
  require('../../assets/images/amiwo_poulet_1772192535717.png'),
  require('../../assets/images/atassi_1772192610097.png'),
  require('../../assets/images/agoun_igname_1772192553037.png'),
  require('../../assets/images/gboman_1772192977053.png'),
  require('../../assets/images/fevi_gombo_1772193101830.png'),
  require('../../assets/images/couscous_poulet.png'),
  require('../../assets/images/ablo_1772192776472.png'),
  require('../../assets/images/goussi_1772194027152.png'),
];

export const getImageSource = (imgPath: string | null | undefined): any => {
  if (!imgPath) {
    return DEFAULT_FOOD_IMAGES[0];
  }

  // Si c'est un lien externe de placeholder générique (picsum, etc.), utiliser de vraies photos gastronomiques
  if (imgPath.includes('picsum.photos') || imgPath.includes('via.placeholder')) {
    // Hasher la chaîne pour attribuer une belle photo de plat cohérente
    let hash = 0;
    for (let i = 0; i < imgPath.length; i++) {
      hash = (hash + imgPath.charCodeAt(i)) % DEFAULT_FOOD_IMAGES.length;
    }
    return DEFAULT_FOOD_IMAGES[hash];
  }

  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
    return { uri: imgPath };
  }

  // Extraire le nom de fichier local
  const filename = imgPath.split('/').pop() || '';
  if (IMAGE_MAP[filename]) {
    return IMAGE_MAP[filename];
  }

  return DEFAULT_FOOD_IMAGES[0];
};
