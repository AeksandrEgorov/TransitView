import { type Rule } from '../types/rule';

export const GALLERY_RULES: Rule[] = [
  {
    id: 1,
    title: "Foto kvaliteet",
    description: `On olemas 3 põhinõuet foto kvaliteedi jaoks:
    1. Fotol oleval sõidukil peab olema mingi identifikaator 
    (see võib olla registreerimisnumber või pardanumber, kui sõidukil puudub registreerimisnumber).
    1.1. Identifikaator pildil peab olema hästi loetav ja ilma liikumishäguta.
    1.2. Erandid. Selline reegel ei kehti järgmistel juhtudel:
    1.2.1. Kui sõidukil üldse puudub registreerimisnumber.
    1.2.2. Kui sõiduk on muuseumieksponaat ilma numbrita.
    Sellisel juhul teeb fotode vastuvõtmise otsuse administraator.
    2. Fotol olev sõiduk ei tohi olla udune selle olulisimas osas.
    2.1. Kui pildil on sõiduk liiga udune ja see takistab selle tajumist, lükatakse foto tagasi.
    2.2. Kui fotol olev udusus ei häiri sõiduki tajumist, teeb fotode vastuvõtmise otsuse administraator.
    3. Fotol ei tohi sõidukit varjata kõrvalised objektid.
    3.1. Kui sõiduk on mingite objektidega tugevalt varjatud ja see takistab sõiduki nägemist, lükatakse foto tagasi.
    3.2. Kui sõiduk on mingite objektide varjus, kuid see ei häiri sõiduki nähtavust, teeb vastuvõtmise otsuse administraator.
    4. (Soovituslik) Soovitame fotol olevate autojuhtide ja teiste inimeste näod ära varjata, kuna me hoolime nii fotograafide kui ka teiste inimeste turvalisusest.
    4.1. Näo varjamine võimaldab mitte rikkuda teiste inimeste privaatsust.
    4.2. Kui juhtide ja teiste inimeste näod ei ole varjatud, võib administraator selle foto tagasi lükata.`,
    variant: "attention"
  },
  {
    id: 2,
    title: "Autoriõigused",
    description: `Laadida võib üles ainult enda tehtud fotosid või teiste autorite fotosid, kuid ainult nende loal.
    Autoriõiguste rikkumise korral, kui laaditakse üles teiste fotod ilma autori loata, juhtub järgmine:
    1. Esimese rikkumise korral antakse hoiatus ja autoriõigusi rikkuv foto eemaldatakse.
    2. Korduva rikkumise korral eemaldatakse kasutaja saidilt.
    3. Kui olete langenud autoriõiguste rikkumise ohvriks, võtke ühendust veebisaidi haldajaga (vt. "Administratsioon").`,
    variant: "danger"
  },
  {
    id: 3,
    title: "Ebasobiv sisu",
    description: `Foto sisu võib olla mis tahes, kuid on mõned erandid.
    1. Fotol ei tohi olla sõjaväe- ega politseitehnikat ja politseinikuid ise, kuna sellist tehnikat ja inimesi ei tohi seaduse järgi pildistada.
    2. Fotol ei tohi olla sõjalisi objekte, kuna see on seadusega keelatud.
    3. fotol ei tohi olla politseijaoskondade piirkondi.
    4. Suletud aladel (sõidukipargid, tööalad jms) tehtud fotod peavad rangelt vastama selle ettevõtte loatele.
    4.1. Selliste kohtade puhul tuleb võtta ühendust administraatoriga ja saata talle väljastatud luba.
    4.2. Seda luba kontrollib administraator ja selle alusel teeb ta otsuse sellistest kohtadest pärit fotode vastuvõtmise kohta.`,
    variant: "danger"
  },
  {
    id: 4,
    title: "Fotode vastuvõtmine",
    description: `
    1. Kasutaja laadib üles foto, mida seejärel vaatab läbi administraator.
    2. Otsuse fotode vastuvõtmise kohta teeb vastavalt nõuetele administraator.
    3. Kui foto lükatakse tagasi, peab administraator jätma kommentaari, milles selgitab, miks foto tagasi lükati (vt. "Administratsiooni kohustused").
    4. Administraator vaatab fotod läbi hiljemalt 3 päeva pärast nende üleslaadimist (vt. "Administratsiooni kohustused").`,
    variant: "info"
  },
  {
    id: 5,
    title: "Pildistamise turvalisus",
    description: `
    Siin on toodud soovitused transpordi ohutuks pildistamiseks.
    1. Soovitatakse pildistamisel minna teest kaugemale.
    1.1. Mida kaugemal teest te asute, seda vähem häirite te juhte ja seda rohkem tagate oma ohutuse.
    2. Soovitatav on vältida pildistamist potentsiaalselt ohtlikes kohtades.
    2.1. Ristmikel ei ole soovitatav pildistada. ristmikel võite teiste autojuhtide teed takistada ja see võib põhjustada konflikti.
    2.2. Politsei juuresolekul ei ole soovitatav pildistada. võivad järgneda politsei küsimused ning te kaotate aega ja närve.
    2.2.1. Politseitehnika ega politseinikud ise ei tohi olla kaadris (vt. "Ebasobiv sisu").
    3. Soovitatakse olla valvas äärekividega piiratud aladel.
    3.1. Sellistel teelõikudel on teie ja sõidukite vaheline kaugus väike. Juht võib peatuda äärekivi juures ja võib tekkida konflikt.
    4. Kui tekib konflikt autojuhidega, püüdke rahulikult ja asjatundlikult selgitada, et te ei kujuta endast nendele ohtu.`,
    variant: "attention"
  },
  {
    id: 6,
    title: "Administratsiooni kohustused",
    description: `
    TransitView administratsioon koosneb kahest põhiisikust:
    1. Administraator
    1.1. Vastutab veebisaidi tehnilise korrashoiu ja reeglite täitmise eest.
    1.2. Teeb lõplikke otsuseid vaidlusaluste fotode ja kasutajakontode osas.
    1.3. Haldab kasutajaõigusi ja andmebaasi struktuuri.
    1.4. Registreerib uusi kasutajaid.
    1.5. Vaatab läbi üleslaaditud fotod vastavalt kehtestatud kvaliteedinõuetele (vt. "Foto kvaliteet").
    1.6. On kohustatud foto tagasilükkamisel lisama selgitava kommentaari, et kasutaja saaks vigadest õppida.
    1.7. Saab teha samad asjad nagu moderaator.
    2. Andmebaasi toimetaja (Moderaator)
    2.1. Kontrollib andmete õigsust (numbrimärgid, mudelid, ettevõtted) ja teeb vajadusel parandusi.
    Administratsioon kohustub vaatama läbi kõik taotlused ja fotod 3 päeva jooksul.
    NB! Kui tekkivad küsimused või probleemid, siis te võite pöörata kas administraatorile või moderaatorile (vt. "Administratsioon")
    `,
    variant: "info"
  }
];