/* Site de Benjamin Huteau — les ajouts de comportement. Version 9 du 17/11/2026.
   RÈGLE : sans ce fichier, tout le texte, tous les liens, la FAQ et le menu restent utilisables.
   Ce fichier ajoute :
   0. le thème clair ou sombre, gardé d'une visite à l'autre ;
   1. les apparitions au défilement, et le titre du premier écran mot à mot ;
   2. l'en-tête de verre, lisible aussi au-dessus du bloc foncé ;
   3. le menu du téléphone ;
   4. le schéma du devis, et son bouton « Valider » ;
   5. les cartes-problèmes qui se déroulent, et le sujet retenu pour l'appel ;
   6. la conversation « Pourquoi passer par moi ? », avec les trois points d'attente ;
   7. la démonstration du tri des mails (une fois à l'arrivée, puis à la demande) ;
   8. la FAQ ouverte par un lien ;
   9. le formulaire de rappel (maquette : rien n'est envoyé) ;
   10. la barre du bas sur téléphone ;
   11. le réseau du premier écran, arrêté dès qu'il sort de l'écran ;
   12. les boutons qui suivent la souris, les cartes qui s'inclinent, le halo du curseur ;
   13. la barre de progression, et la section « Comment ça se passe » qui file de côté. */
(function () {
  'use strict';

  var racine = document.documentElement;
  var mouvementPermis = window.matchMedia('(prefers-reduced-motion: no-preference)');
  var petitEcran = window.matchMedia('(max-width: 920px)');
  var sourisFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var mouvementReduit = function () { return !mouvementPermis.matches; };

  function tous(selecteur, parent) { return Array.prototype.slice.call((parent || document).querySelectorAll(selecteur)); }
  function creer(balise, classe, texte) {
    var element = document.createElement(balise);
    if (classe) element.className = classe;
    if (texte) element.textContent = texte;
    return element;
  }

  /* ---------- 0. Le thème ----------
     Tant que Bentoto n'a rien choisi, la page suit le réglage de l'ordinateur (c'est la feuille de
     style qui s'en occupe). Dès qu'il clique sur la lune, son choix est gardé. */
  var boutonTheme = document.querySelector('[data-theme-bouton]');
  var prefereSombre = window.matchMedia('(prefers-color-scheme: dark)');
  function themeCourant() {
    var pose = racine.getAttribute('data-theme');
    if (pose === 'sombre' || pose === 'clair') return pose;
    return prefereSombre.matches ? 'sombre' : 'clair';
  }
  function poserTheme(nom) {
    if (nom === 'sombre' || nom === 'clair') racine.setAttribute('data-theme', nom);
    else racine.removeAttribute('data-theme');
    if (boutonTheme) {
      var sombre = themeCourant() === 'sombre';
      /* Un interrupteur : le nom ne change pas, c'est « coché » ou non qui change. */
      boutonTheme.setAttribute('aria-checked', String(sombre));
      boutonTheme.setAttribute('aria-label', 'Mode sombre');
      boutonTheme.setAttribute('title', sombre ? 'Revenir au thème clair' : 'Passer au thème sombre');
    }
  }
  var garde = null;
  try { garde = window.localStorage.getItem('theme'); } catch (e) { garde = null; }
  if (garde === 'sombre' || garde === 'clair') racine.setAttribute('data-theme', garde);
  poserTheme(racine.getAttribute('data-theme') || '');

  function echangerTheme() {
    var suivant = themeCourant() === 'sombre' ? 'clair' : 'sombre';
    var appliquer = function () {
      racine.setAttribute('data-theme', suivant);
      poserTheme(suivant);
      try { window.localStorage.setItem('theme', suivant); } catch (e) { /* navigation privée : on continue sans garder */ }
    };
    if (document.startViewTransition && !mouvementReduit()) document.startViewTransition(appliquer);
    else appliquer();
    window.setTimeout(function () { dessinerReseau(false); }, 120);
  }
  if (boutonTheme) boutonTheme.addEventListener('click', echangerTheme);
  prefereSombre.addEventListener('change', function () {
    if (racine.getAttribute('data-theme')) return;
    poserTheme('');
    window.setTimeout(function () { dessinerReseau(false); }, 120);
  });

  /* ---------- 1. Les apparitions au défilement ---------- */
  if (!mouvementReduit()) racine.classList.add('anime');

  /* Filet de sécurité : si un programme échoue en route, tout réapparaît au bout de 2,5 s. */
  window.setTimeout(function () {
    tous('[data-reveal]').forEach(function (element) { element.classList.add('est-visible'); });
  }, 2500);

  tous('[data-reveal-groupe]').forEach(function (groupe) {
    tous('[data-reveal]', groupe).forEach(function (element, rang) {
      element.style.setProperty('--retard', (rang * 0.08).toFixed(2) + 's');
    });
  });

  var aReveler = tous('[data-reveal]');
  if (aReveler.length && 'IntersectionObserver' in window && !mouvementReduit()) {
    var guetteurReveal = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (entree) {
        if (!entree.isIntersecting) return;
        entree.target.classList.add('est-visible');
        guetteurReveal.unobserve(entree.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    aReveler.forEach(function (element) { guetteurReveal.observe(element); });
  } else {
    aReveler.forEach(function (element) { element.classList.add('est-visible'); });
  }

  /* Le titre du premier écran : chaque mot sort de sa boîte, l'un après l'autre. */
  var accueil = document.querySelector('[data-accueil]');
  if (accueil && !mouvementReduit()) {
    window.requestAnimationFrame(function () {
      window.setTimeout(function () { accueil.classList.add('accueil--pret'); }, 60);
    });
  } else if (accueil) {
    accueil.classList.add('accueil--pret');
  }

  /* ---------- 2. L'en-tête passe en lettres blanches au-dessus du bloc foncé ---------- */
  var entete = document.querySelector('.entete');
  var blocFonce = document.querySelector('[data-contact]');
  if (entete && blocFonce) {
    var surveiller = function () {
      var barreHaut = entete.getBoundingClientRect(), bloc = blocFonce.getBoundingClientRect();
      var milieu = barreHaut.top + barreHaut.height / 2;
      entete.classList.toggle('entete--sur-fonce', bloc.top <= milieu && bloc.bottom >= milieu);
    };
    window.addEventListener('scroll', surveiller, { passive: true });
    window.addEventListener('resize', surveiller);
    surveiller();
  }

  /* ---------- 3. Le menu du téléphone ---------- */
  var menuMobile = document.getElementById('menu-mobile');
  if (menuMobile && menuMobile.hidePopover) {
    menuMobile.addEventListener('click', function (evenement) {
      if (evenement.target.closest('a')) menuMobile.hidePopover();
    });
  }

  /* ---------- 4. Le schéma : les étapes s'allument, « votre accord » attend le clic ---------- */
  var schema = document.querySelector('[data-schema]');
  var accord = schema && schema.querySelector('[data-accord]');
  var boutonValider = schema && schema.querySelector('[data-valider]');
  if (accord && boutonValider) {
    boutonValider.hidden = false;
    var titreAccord = accord.querySelector('[data-accord-titre]');
    var texteAccord = accord.querySelector('[data-accord-texte]');
    var depart = { titre: titreAccord.textContent, texte: texteAccord.textContent, bouton: boutonValider.textContent };
    boutonValider.addEventListener('click', function () {
      var valide = accord.classList.toggle('etape--valide');
      titreAccord.textContent = valide ? 'Validé : le devis part chez votre client.' : depart.titre;
      texteAccord.textContent = valide ? 'Ici, c’est un exemple : rien n’est envoyé.' : depart.texte;
      boutonValider.textContent = valide ? 'Rejouer l’exemple' : depart.bouton;
    });
  }
  if (schema && 'IntersectionObserver' in window) {
    var guetteurSchema = new IntersectionObserver(function (entrees) {
      if (entrees[0].isIntersecting) { schema.classList.add('schema--joue'); guetteurSchema.disconnect(); }
    }, { threshold: 0.5 });
    guetteurSchema.observe(schema);
  } else if (schema) {
    schema.classList.add('schema--joue');
  }

  /* ---------- 5. Le sujet retenu, et les cartes-problèmes ---------- */
  var sujet = document.querySelector('[data-sujet]');
  function retenirSujet(texte) {
    /* Le sujet suit le visiteur d'une page à l'autre : il est gardé dans la session du navigateur. */
    try {
      if (texte) window.sessionStorage.setItem('sujet-appel', texte);
      else window.sessionStorage.removeItem('sujet-appel');
    } catch (e) { /* navigation privée : on continue sans garder */ }
    if (!sujet) return;
    sujet.hidden = !texte;
    sujet.querySelector('[data-sujet-texte]').textContent = texte;
    sujet.querySelector('input').value = texte;
  }
  if (sujet) {
    sujet.querySelector('[data-sujet-retirer]').addEventListener('click', function () { retenirSujet(''); });
    var sujetGarde = null;
    try { sujetGarde = window.sessionStorage.getItem('sujet-appel'); } catch (e) { sujetGarde = null; }
    if (sujetGarde) retenirSujet(sujetGarde);
  }
  /* Un bouton général ne garde pas le sujet d'un clic précédent. */
  tous('a[href="#contact"], a[href="#rappel"], a[href="contact.html"], a[href="contact.html#rappel"]').forEach(function (lien) {
    if (!lien.hasAttribute('data-sujet-lien')) lien.addEventListener('click', function () { retenirSujet(''); });
  });
  tous('[data-sujet-lien]').forEach(function (lien) {
    lien.addEventListener('click', function () { retenirSujet(lien.getAttribute('data-sujet-lien')); });
  });

  var listeGaleres = document.querySelector('[data-galeres]');
  if (listeGaleres) {
    var galeres = tous('[data-galere]', listeGaleres);
    var derouler = function (carte) {
      galeres.forEach(function (autre) {
        var ouverte = autre === carte;
        autre.classList.toggle('galere--ouverte', ouverte);
        var bouton = autre.querySelector('.galere__bouton');
        if (bouton) bouton.setAttribute('aria-expanded', String(ouverte));
      });
    };
    galeres.forEach(function (carte, rang) {
      var titre = carte.querySelector('.galere__dire');
      var reponse = carte.querySelector('.galere__reponse');
      reponse.id = 'galere-' + (rang + 1);
      var bouton = creer('button', 'galere__bouton');
      bouton.type = 'button';
      bouton.setAttribute('aria-controls', reponse.id);
      bouton.appendChild(creer('span', '', titre.textContent));
      var signe = creer('span', 'galere__signe');
      signe.setAttribute('aria-hidden', 'true');
      signe.innerHTML = '<svg class="pic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>';
      bouton.appendChild(signe);
      titre.textContent = '';
      titre.appendChild(bouton);
      bouton.addEventListener('click', function () { derouler(carte); });
      bouton.addEventListener('focus', function () { derouler(carte); });
      var attenteSurvol = 0;
      carte.addEventListener('pointerenter', function (evenement) {
        if (evenement.pointerType !== 'mouse') return;
        attenteSurvol = window.setTimeout(function () { derouler(carte); }, 180);
      });
      carte.addEventListener('pointerleave', function () { window.clearTimeout(attenteSurvol); });
    });
    listeGaleres.setAttribute('data-pret', '');
    derouler(galeres[0]);
  }

  /* ---------- 6. « Pourquoi passer par moi ? » : une conversation ---------- */
  var discussion = document.querySelector('[data-discussion]');
  if (discussion) {
    var fil = discussion.querySelector('[data-fil]');
    var choixQuestions = discussion.querySelector('[data-choix]');
    var echanges = tous('[data-echange]', discussion);
    var ordreDepart = echanges.slice();
    var dernier = null;
    var finDiscussion = discussion.querySelector('[data-fin]');
    var proposer = function () {
      while (choixQuestions.firstChild) choixQuestions.removeChild(choixQuestions.firstChild);
      var restants = echanges.filter(function (e) { return !e.classList.contains('echange--pose'); });
      var poses = echanges.length - restants.length;
      var suites = dernier ? (dernier.getAttribute('data-suites') || '').split(' ') : ['question-donnees', 'question-servir'];
      var enTete = restants.filter(function (e) { return suites.indexOf(e.id) >= 0; });
      var autres = dernier ? restants.filter(function (e) { return suites.indexOf(e.id) < 0; }) : [];
      choixQuestions.appendChild(creer('p', 'discussion__titre', restants.length ? (poses ? 'Une autre question ? (' + poses + ' sur ' + echanges.length + ')' : 'Cliquez sur une question :') : 'Vous avez tout vu. On en parle ?'));
      if (finDiscussion) finDiscussion.classList.toggle('discussion__fin--visible', poses > 0);
      enTete.concat(autres).forEach(function (echange) {
        var bouton = creer('button', 'choix', echange.querySelector('.message--vous').textContent);
        bouton.type = 'button';
        bouton.addEventListener('click', function () { poser(echange); });
        choixQuestions.appendChild(bouton);
      });
      if (poses) {
        var recommencer = creer('button', 'choix choix--discret', 'Recommencer');
        recommencer.type = 'button';
        recommencer.addEventListener('click', function () {
          echanges.forEach(function (e) { e.classList.remove('echange--pose', 'echange--arrive'); });
          ordreDepart.forEach(function (e) { fil.appendChild(e); });
          dernier = null;
          proposer();
          discussion.scrollIntoView({ block: 'start' });
        });
        choixQuestions.appendChild(recommencer);
      }
    };
    var poser = function (echange) {
      var attendre = creer('li', 'ecrit');
      attendre.setAttribute('aria-hidden', 'true');
      attendre.appendChild(creer('i')); attendre.appendChild(creer('i')); attendre.appendChild(creer('i'));
      fil.appendChild(attendre);
      echange.scrollIntoView({ block: 'nearest' });
      var montrer = function () {
        if (attendre.parentNode) attendre.parentNode.removeChild(attendre);
        fil.appendChild(echange);
        echanges.forEach(function (e) { e.classList.remove('echange--arrive'); });
        echange.classList.add('echange--pose', 'echange--arrive');
        dernier = echange;
        proposer();
        echange.scrollIntoView({ block: 'nearest' });
      };
      if (mouvementReduit()) montrer(); else window.setTimeout(montrer, 420);
    };
    fil.setAttribute('role', 'log');
    fil.setAttribute('aria-live', 'polite');
    choixQuestions.hidden = false;
    discussion.setAttribute('data-pret', '');
    proposer();
  }

  /* ---------- 7. La démonstration du tri des mails ---------- */
  var demo = document.querySelector('[data-demo-mails]');
  if (demo) {
    var mails = tous('[data-mails] .mail', demo);
    var dossiers = tous('[data-dossiers] .dossier', demo);
    var recommencerDemo = demo.querySelector('[data-recommencer]');
    var aJoue = false;
    var minuteurs = [];
    var remettreDemo = function () {
      minuteurs.forEach(function (t) { window.clearTimeout(t); });
      minuteurs = [];
      mails.forEach(function (mail) {
        mail.classList.remove('mail--parti');
        mail.removeAttribute('data-fait');
        var geste = mail.querySelector('.mail__geste');
        if (geste) geste.textContent = 'Trier';
      });
      dossiers.forEach(function (dossier) {
        dossier.classList.remove('dossier--rempli', 'dossier--dernier');
        var compte = dossier.querySelector('[data-compte]');
        if (compte) compte.textContent = 'vide';
      });
      if (recommencerDemo) recommencerDemo.hidden = true;
    };
    var trierUn = function (mail) {
      if (mail.hasAttribute('data-fait')) return;
      mail.setAttribute('data-fait', '');
      mail.classList.add('mail--parti');
      var geste = mail.querySelector('.mail__geste');
      if (geste) geste.textContent = mail.getAttribute('data-geste') || 'Rangé';
      var dossier = null;
      dossiers.forEach(function (d) { if (d.getAttribute('data-nom') === mail.getAttribute('data-dossier')) dossier = d; });
      if (!dossier) return;
      dossier.classList.add('dossier--rempli', 'dossier--dernier');
      var compte = dossier.querySelector('[data-compte]');
      if (compte) {
        var nombre = (parseInt(compte.getAttribute('data-nombre'), 10) || 0) + 1;
        compte.setAttribute('data-nombre', String(nombre));
        compte.textContent = nombre + ' mail' + (nombre > 1 ? 's' : '');
      }
      minuteurs.push(window.setTimeout(function () { dossier.classList.remove('dossier--dernier'); }, 1000));
    };
    var jouer = function () {
      minuteurs.push(window.setTimeout(function () { trierUn(mails[0]); }, 250));
      minuteurs.push(window.setTimeout(function () { trierUn(mails[1]); }, 1050));
      minuteurs.push(window.setTimeout(function () { trierUn(mails[2]); }, 1850));
      minuteurs.push(window.setTimeout(function () { if (recommencerDemo) recommencerDemo.hidden = false; }, 2700));
    };
    if ('IntersectionObserver' in window && !mouvementReduit()) {
      var guetteurDemo = new IntersectionObserver(function (entrees) {
        if (!entrees[0].isIntersecting || aJoue) return;
        aJoue = true;
        jouer();
        guetteurDemo.disconnect();
      }, { threshold: 0.45 });
      guetteurDemo.observe(demo);
    } else {
      trierUn(mails[0]); trierUn(mails[1]); trierUn(mails[2]);
    }
    mails.forEach(function (mail) {
      mail.addEventListener('click', function () {
        if (demo.getAttribute('data-pret')) return;
        trierUn(mail);
        if (recommencerDemo && mails.every(function (m) { return m.hasAttribute('data-fait'); })) recommencerDemo.hidden = false;
      });
    });
    if (recommencerDemo) recommencerDemo.addEventListener('click', function () { remettreDemo(); jouer(); });
  }

  /* ---------- 8. La FAQ : un lien ouvre la question qu'il vise, même depuis une autre page ---------- */
  var ouvrirQuestion = function () {
    var id = (window.location.hash || '').slice(1);
    if (!id) return;
    var cible = document.getElementById(id);
    if (cible && cible.tagName === 'DETAILS') cible.open = true;
  };
  window.addEventListener('hashchange', ouvrirQuestion);
  ouvrirQuestion();

  /* ---------- 9. Le formulaire de rappel (MAQUETTE) ---------- */
  var formulaire = document.querySelector('[data-formulaire]');
  var confirmation = document.querySelector('[data-confirmation]');
  if (formulaire && confirmation) {
    var champs = formulaire.elements;
    formulaire.querySelector('[data-envoyer]').disabled = false;
    formulaire.querySelector('[data-formulaire-note]').textContent = 'Maquette : vous pouvez essayer le formulaire. Rien n’est envoyé.';
    var montrerErreur = function (id, visible) {
      var erreur = document.getElementById(id);
      erreur.hidden = !visible;
    };
    formulaire.addEventListener('submit', function (evenement) {
      evenement.preventDefault();
      var prenom = champs.prenom.value.trim();
      var telephone = champs.telephone.value.trim();
      var courriel = champs.courriel.value.trim();
      var chiffres = telephone.replace(/\D/g, '');
      var telephoneJuste = !telephone || (/^[\d\s.+()-]+$/.test(telephone) && chiffres.length >= 9 && chiffres.length <= 13);
      var courrielJuste = !courriel || champs.courriel.checkValidity();
      var soucis = (!telephone && !courriel) ? 'Indiquez un téléphone ou un e-mail, pour qu’on puisse vous joindre.'
        : !telephoneJuste ? 'Ce numéro semble incomplet. Il faut 10 chiffres, par exemple 06 12 34 56 78.'
        : !courrielJuste ? 'Cet e-mail semble incomplet. Il doit ressembler à prenom@exemple.fr.' : '';
      montrerErreur('prenom-erreur', !prenom);
      document.getElementById('joindre-erreur').textContent = soucis || 'Indiquez un téléphone ou un e-mail, pour qu’on puisse vous joindre.';
      montrerErreur('joindre-erreur', !!soucis);
      champs.prenom.setAttribute('aria-invalid', String(!prenom));
      champs.telephone.setAttribute('aria-invalid', String(!telephoneJuste));
      champs.courriel.setAttribute('aria-invalid', String(!courrielJuste));
      if (!prenom) { champs.prenom.focus(); return; }
      if (!telephone && !courriel) { champs.telephone.focus(); return; }
      if (!telephoneJuste) { champs.telephone.focus(); return; }
      if (!courrielJuste) { champs.courriel.focus(); return; }
      if (champs['site-web'].value) return;
      while (confirmation.firstChild) confirmation.removeChild(confirmation.firstChild);
      confirmation.appendChild(creer('p', 'petit-titre', 'C’est noté, ' + prenom + '.'));
      confirmation.appendChild(creer('p', '', 'On vous rappelle sous 48 h ouvrées' + (telephone ? ' au ' + telephone : ' à l’adresse ' + courriel) + '.'));
      if (champs.sujet && champs.sujet.value) confirmation.appendChild(creer('p', '', 'Votre sujet : ' + champs.sujet.value + '.'));
      confirmation.appendChild(creer('p', '', 'Maquette : rien n’a été envoyé.'));
      var corriger = creer('button', '', 'Corriger mes coordonnées');
      corriger.type = 'button';
      corriger.addEventListener('click', function () {
        confirmation.hidden = true;
        formulaire.hidden = false;
        champs.prenom.focus();
      });
      confirmation.appendChild(corriger);
      formulaire.hidden = true;
      confirmation.hidden = false;
    });
  }

  /* ---------- 10. La barre du bas, sur téléphone ---------- */
  var barre = document.querySelector('[data-barre]');
  var actions = document.querySelector('[data-actions]');
  var contact = document.querySelector('[data-contact]');
  if (barre && 'IntersectionObserver' in window) {
    var actionsVisibles = !!actions, contactVisible = false, saisie = false;
    var majBarre = function () {
      if (!actionsVisibles && !contactVisible && !saisie) barre.setAttribute('data-visible', '');
      else barre.removeAttribute('data-visible');
    };
    if (actions) {
      new IntersectionObserver(function (entrees) { actionsVisibles = entrees[0].isIntersecting; majBarre(); }).observe(actions);
    } else {
      /* Page sans premier écran : la barre arrive dès qu'on a dépassé le haut. */
      var majHaut = function () { actionsVisibles = window.scrollY < 200; majBarre(); };
      window.addEventListener('scroll', majHaut, { passive: true });
      majHaut();
    }
    if (contact) new IntersectionObserver(function (entrees) { contactVisible = entrees[0].isIntersecting; majBarre(); }, { threshold: 0.02 }).observe(contact);
    document.addEventListener('focusin', function (evenement) { saisie = !!evenement.target.closest('input, textarea, select'); majBarre(); });
    document.addEventListener('focusout', function () { saisie = false; majBarre(); });
  }

  /* ---------- 11. Le réseau du premier écran ----------
     Dessiné sans bibliothèque. Il tourne tant qu'il est visible, et s'arrête dès qu'on le quitte
     ou que l'onglet passe en arrière-plan. Avec « réduire les animations », il reste fixe. */
  var toile = document.querySelector('[data-reseau]');
  var arreterReseau = null;
  var reseauVisible = true;
  function dessinerReseau(sansMouvement) {
    if (arreterReseau) { arreterReseau(); arreterReseau = null; }
    if (!toile || petitEcran.matches) return;
    var cadre = toile.getBoundingClientRect();
    if (!cadre.width || !cadre.height) return;
    var finesse = Math.min(window.devicePixelRatio || 1, 2);
    toile.width = Math.round(cadre.width * finesse);
    toile.height = Math.round(cadre.height * finesse);
    var ctx = toile.getContext('2d');
    var L = toile.width, H = toile.height;
    var jetons = window.getComputedStyle(racine);
    var encre = jetons.getPropertyValue('--encre-rvb').trim() || '14, 35, 70';
    var teinte = jetons.getPropertyValue('--action-rvb').trim() || encre;
    /* la force du dessin vient des jetons : elle monte en thème sombre */
    var forceTrait = parseFloat(jetons.getPropertyValue('--reseau-trait')) || 0.16;
    var forcePoint = parseFloat(jetons.getPropertyValue('--reseau-point')) || 0.55;

    var graine = 7;
    function hasard() { graine = (graine * 16807) % 2147483647; return graine / 2147483647; }
    var sommets = [];
    for (var i = 0; i < 90; i++) {
      var theta = Math.acos(2 * hasard() - 1), phi = hasard() * Math.PI * 2, rayon = 0.7 + hasard() * 0.3;
      sommets.push([rayon * Math.sin(theta) * Math.cos(phi), rayon * Math.sin(theta) * Math.sin(phi), rayon * Math.cos(theta)]);
    }
    var liens = [];
    for (var a = 0; a < sommets.length; a++) {
      for (var b = a + 1; b < sommets.length; b++) {
        var dx = sommets[a][0] - sommets[b][0], dy = sommets[a][1] - sommets[b][1], dz = sommets[a][2] - sommets[b][2];
        if (dx * dx + dy * dy + dz * dz < 0.2) liens.push([a, b]);
      }
    }
    function dessiner(temps) {
      /* La souris ne fait plus tourner le réseau (ça faisait sauter toutes les lignes d'un coup).
         Elle le déplace de quelques pixels, tout au plus. */
      var angle = temps * 0.00006 + (sourisX * 0.05), cos = Math.cos(angle), sin = Math.sin(angle);
      var echelle = Math.min(L, H) * 0.66;
      var glisseX = sourisX * 16 * finesse, glisseY = sourisY * 12 * finesse;
      var vus = sommets.map(function (p) {
        var x = p[0] * cos + p[2] * sin, z = -p[0] * sin + p[2] * cos, recul = 1 / (2 - z * 0.6);
        return [L * 0.56 + x * echelle * recul * 1.6 + glisseX, H * 0.5 + p[1] * echelle * recul * 1.6 + glisseY, recul];
      });
      ctx.clearRect(0, 0, L, H);
      ctx.lineWidth = finesse;
      ctx.strokeStyle = 'rgba(' + encre + ', ' + forceTrait + ')';
      liens.forEach(function (lien) {
        ctx.beginPath(); ctx.moveTo(vus[lien[0]][0], vus[lien[0]][1]); ctx.lineTo(vus[lien[1]][0], vus[lien[1]][1]); ctx.stroke();
      });
      ctx.fillStyle = 'rgba(' + teinte + ', ' + forcePoint + ')';
      vus.forEach(function (v) { ctx.beginPath(); ctx.arc(v[0], v[1], 3.2 * v[2] * finesse, 0, Math.PI * 2); ctx.fill(); });
    }
    var debut = performance.now(), image = 0, fini = false;
    function boucle(maintenant) {
      if (fini) return;
      dessiner(maintenant - debut);
      image = window.requestAnimationFrame(boucle);
    }
    if (sansMouvement || mouvementReduit()) { dessiner(0); return; }
    image = window.requestAnimationFrame(boucle);
    arreterReseau = function () { fini = true; window.cancelAnimationFrame(image); };
  }
  var sourisX = 0, sourisY = 0;
  dessinerReseau(false);
  if (toile && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entrees) {
      var visible = entrees[0].isIntersecting;
      if (visible === reseauVisible) return;
      reseauVisible = visible;
      if (visible) dessinerReseau(false); else if (arreterReseau) { arreterReseau(); arreterReseau = null; }
    }, { threshold: 0.02 }).observe(toile);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (arreterReseau) { arreterReseau(); arreterReseau = null; } }
    else if (reseauVisible) dessinerReseau(false);
  });
  var attente = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(attente);
    attente = window.setTimeout(function () {
      if (!toile) return;
      if (petitEcran.matches) { if (arreterReseau) { arreterReseau(); arreterReseau = null; } return; }
      var cadre = toile.getBoundingClientRect();
      if (Math.abs(cadre.width * Math.min(window.devicePixelRatio || 1, 2) - toile.width) > 40) dessinerReseau(false);
    }, 250);
  });

  /* ---------- 12. Le curseur, les boutons magnétiques, les cartes inclinées ---------- */
  if (sourisFine && !mouvementReduit()) {
    var halo = document.querySelector('[data-curseur]');
    var cibleX = 0, cibleY = 0, iciX = 0, iciY = 0, haloVisible = false;
    var suivre = function () {
      iciX += (cibleX - iciX) * 0.18;
      iciY += (cibleY - iciY) * 0.18;
      if (halo) halo.style.transform = 'translate3d(' + iciX + 'px,' + iciY + 'px,0)';
      window.requestAnimationFrame(suivre);
    };
    if (halo) {
      window.requestAnimationFrame(suivre);
      document.addEventListener('pointermove', function (evenement) {
        cibleX = evenement.clientX; cibleY = evenement.clientY;
        sourisX = (evenement.clientX / window.innerWidth - 0.5) * 0.6;
        sourisY = (evenement.clientY / window.innerHeight - 0.5);
        if (!haloVisible) { halo.classList.add('curseur--visible'); haloVisible = true; }
      }, { passive: true });
      document.addEventListener('pointerleave', function () { halo.classList.remove('curseur--visible'); haloVisible = false; });
      document.addEventListener('pointerdown', function () { halo.classList.add('curseur--clic'); });
      document.addEventListener('pointerup', function () { halo.classList.remove('curseur--clic'); });
      document.addEventListener('pointerover', function (evenement) {
        halo.classList.toggle('curseur--survol', !!evenement.target.closest('a, button, summary, [data-magnetique]'));
      });
    }

    /* Les boutons qui se déplacent de quelques pixels vers la souris. */
    tous('[data-magnetique]').forEach(function (bouton) {
      var dedans = function (evenement) {
        var r = bouton.getBoundingClientRect();
        var dx = (evenement.clientX - (r.left + r.width / 2)) * 0.16;
        var dy = (evenement.clientY - (r.top + r.height / 2)) * 0.22;
        var limite = 7;
        dx = Math.max(-limite, Math.min(limite, dx));
        dy = Math.max(-limite, Math.min(limite, dy));
        bouton.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
      };
      bouton.addEventListener('pointermove', dedans);
      bouton.addEventListener('pointerleave', function () { bouton.style.transform = ''; });
    });

    /* Les cartes qui s'inclinent très légèrement sous la souris. */
    tous('.galere, .comparaison, .offre, .temps').forEach(function (carte) {
      carte.addEventListener('pointermove', function (evenement) {
        var r = carte.getBoundingClientRect();
        var x = (evenement.clientX - r.left) / r.width - 0.5;
        var y = (evenement.clientY - r.top) / r.height - 0.5;
        carte.style.transform = 'perspective(900px) rotateX(' + (-y * 3.2).toFixed(2) + 'deg) rotateY(' + (x * 3.2).toFixed(2) + 'deg) translateY(-3px)';
      });
      carte.addEventListener('pointerleave', function () { carte.style.transform = ''; });
    });
  }

  /* ---------- 13. La barre de progression, et la section qui file de côté ---------- */
  var progres = document.querySelector('[data-progres]');
  var coulisse = document.querySelector('.coulisse');
  var piste = coulisse && coulisse.querySelector('[data-piste]');
  var compte = coulisse && coulisse.querySelector('[data-compte]');
  var course = 0;
  var coulisseActive = false;

  function mesurerCoulisse() {
    if (!coulisse || !piste) return;
    if (petitEcran.matches || mouvementReduit()) { desactiverCoulisse(); return; }
    if (!coulisseActive) {
      coulisse.classList.add('coulisse--actif');
      coulisseActive = true;
    }
    piste.style.transform = 'translate3d(0,0,0)';
    course = Math.max(0, piste.scrollWidth - window.innerWidth);
    coulisse.style.setProperty('--course', Math.round(window.innerHeight + course) + 'px');
  }
  function desactiverCoulisse() {
    if (!coulisse || !coulisseActive) return;
    coulisse.classList.remove('coulisse--actif');
    coulisse.style.removeProperty('--course');
    if (piste) piste.style.transform = '';
    coulisseActive = false;
    course = 0;
  }
  function auDefilement() {
    var hauteur = document.documentElement.scrollHeight - window.innerHeight;
    if (progres) progres.style.transform = 'scaleX(' + (hauteur > 0 ? Math.min(1, window.scrollY / hauteur) : 0) + ')';
    if (!coulisse || !coulisseActive) return;
    var r = coulisse.getBoundingClientRect();
    var total = coulisse.offsetHeight - window.innerHeight;
    var avance = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    if (piste) piste.style.transform = 'translate3d(' + (-avance * course).toFixed(1) + 'px,0,0)';
    if (compte) compte.textContent = (Math.floor(avance * 3.999) + 1) + ' / 4';
  }
  mesurerCoulisse();
  auDefilement();
  var attenteCoulisse = 0;
  var rythme = false;
  window.addEventListener('scroll', function () {
    if (rythme) return;
    rythme = true;
    window.requestAnimationFrame(function () { auDefilement(); rythme = false; });
  }, { passive: true });
  window.addEventListener('resize', function () {
    window.clearTimeout(attenteCoulisse);
    attenteCoulisse = window.setTimeout(function () { mesurerCoulisse(); auDefilement(); }, 200);
  });
})();
