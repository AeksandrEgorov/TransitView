import { type Rule } from '../types/rule';

export const GALLERY_RULES: Rule[] = [
  {
    id: 1,
    title: "Foto kvaliteet",
    description: `On olemas 3 põhi nõuded foto kvaliteedi jaoks:
    1. Fotol oleval sõidukil peab olema mingi identifikaator 
    (see võib olla registreerimisnumber või pargimisnumber, kui sõidukil puudub registreerimisnumber).
    1.1. Identifikaator pildil peab olema hästi loetav ja ilma liikumishäguta.
    1.2. Erandid. Selline reegel ei kehti järgmistel juhtudel:
    1.2.1. Kui sõidukil üldse puudub registreerimisnumber.
    1.2.2. Kui sõiduk on muuseumieksponaat ilma numbrita.
    Sellisel juhul teeb fotode vastuvõtmise otsuse administraator.
    2. Fotol olev sõiduk ei tohi olla udune selle olulisimas osas.
    2.1. Kui pildil on sõiduk liiga udune ja see takistab selle tajumist, lükatakse foto tagasi.
    2.2. Kui fotol olev määrdeaine ei häiri sõiduki tajumist, teeb fotode vastuvõtmise otsuse administraator.
    3. Fotol ei tohi sõidukit varjata kõrvalised objektid.
    3.1. Kui sõiduk on mingite objektidega tugevalt varjatud ja see takistab sõiduki nägemist, lükatakse foto tagasi.
    3.2. Kui sõiduk on mingite objektide varjus, kuid see ei häiri sõiduki nähtavust, teeb vastuvõtmise otsuse administraator.
    4. (Soovituslik) Soovitame fotol olevate autojuhtide ja teiste inimeste näod ära varjata, kuna me hoolime nii fotograafide kui ka teiste inimeste turvalisusest.
    4.1. Näo varjamine võimaldab mitte rikkuda teiste inimeste privaatsust.
    4.2. Kui juhtide ja teiste inimeste näod ei ole varjatud, võib administraator selle foto tagasi lükata.`,
    isAllowed: true
  },
  {
    id: 2,
    title: "Autoriõigused",
    description: `Laadida võib üles ainult enda tehtud fotosid või teiste autorite fotosid, kuid ainult nende loal.
    Autoriõiguste rikkumise korral, kui laaditakse üles teiste fotod ilma autori loata, juhtub järgmine:
    1. Esimese rikkumise korral antakse hoiatus ja autoriõigusi rikkuv foto eemaldatakse.
    2. Korduva rikkumise korral eemaldatakse kasutaja saidilt.
    3. Kui olete langenud autoriõiguste rikkumise ohvriks, võtke ühendust veebisaidi haldajaga.`,
    isAllowed: true
  },
  {
    id: 3,
    title: "Ebasobiv sisu",
    description: `Foto sisu võib olla mis tahes, kuid on mõned erandid.
    1. Fotol ei tohi olla sõjaväe- ega politseitehnikat, kuna sellist tehnikat ei tohi seaduse järgi pildistada.
    2. Fotol ei tohi olla sõjalisi objekte, kuna see on seadusega keelatud.
    3. fotol ei tohi olla politseijaoskondade piirkondi.
    4. Suletud aladel (sõidukipargid, tööalad jms) tehtud fotod peavad rangelt vastama selle ettevõtte loatele.
    4.1. Selliste kohtade puhul tuleb võtta ühendust administraatoriga ja saata talle väljastatud luba.
    4.2. Seda luba kontrollib administraator ja selle alusel teeb ta otsuse sellistest kohtadest pärit fotode vastuvõtmise kohta.`,
    isAllowed: false
  },
  {
    id: 4,
    title: "Fotode vastuvõtmine",
    description: `
    1. Kasutaja laadib üles foto, mida seejärel vaatab läbi administraator.
    2. Otsuse fotode vastuvõtmise kohta teeb vastavalt nõuetele administraator.
    3. Kui foto lükatakse tagasi, peab administraator jätma kommentaari, milles selgitab, miks foto tagasi lükati.
    4. Administraator vaatab fotod läbi hiljemalt 3 päeva pärast nende üleslaadimist.`,
    isAllowed: true
  },
  {
    id: 5,
    title: "Pildistamise turvalisus",
    description: `
    1. Siin on toodud soovitused transpordi ohutuks pildistamiseks.
    2. Soovitatakse pildistamisel minna teest kaugemale.
    2.1. Mida kaugemal teest te asute, seda vähem häirite te juhte ja seda rohkem tagate oma ohutuse.
    3. Soovitatav on vältida pildistamist potentsiaalselt ohtlikes kohtades.
    3.1. Ristmikel ei ole soovitatav pildistada. ristmikel võite teiste autojuhtide teed takistada ja see võib põhjustada konflikti.
    3.2. Politsei juuresolekul ei ole soovitatav pildistada. võivad järgneda politsei küsimused ning te kaotate aega ja närve.
    3.2.1. Politseitehnika ega politseinikud ise ei tohi olla kaadris (vt. "Ebasobiv sisu").
    4. Soovitatakse olla valvas äärekividega piiratud aladel.
    4.1. Sellistel teelõikudel on teie ja sõidukite vaheline kaugus väike. Juht võib peatuda äärekivi juures ja võib tekkida konflikt.
    5. Kui tekib konflikt autojuhidega, püüdke rahulikult ja asjatundlikult selgitada, et te ei kujuta endast nendele ohtu.`,
    isAllowed: true
  }
];