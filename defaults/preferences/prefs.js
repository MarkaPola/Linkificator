
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Linkificator preferences - Linkificator's module
 * author: MarkaPola */

pref("extensions.linkificator@markapola.activated", true);
pref("extensions.linkificator@markapola.displayWidget", true);
pref("extensions.linkificator@markapola.contextMenuIntegration", true);
pref("extensions.linkificator@markapola.widgetMiddleClick", "toggle");
pref("extensions.linkificator@markapola.widgetRightClick", "none");
pref("extensions.linkificator@markapola.hotkeyName", "hotkeyToggle");
pref("extensions.linkificator@markapola.hotkeyValue", "control-shift-y");
pref("extensions.linkificator@markapola.hotkeyToggle", "control-shift-y");
pref("extensions.linkificator@markapola.hotkeyManage", "control-shift-x");
pref("extensions.linkificator@markapola.hotkeyParse", "control-shift-u");
pref("extensions.linkificator@markapola.useRegExp", true);
pref("extensions.linkificator@markapola.filterMode", "black");
pref("extensions.linkificator@markapola.whitelist", "");
pref("extensions.linkificator@markapola.blacklist", "^about: localhost www\\.google\\..* www\\.deezer\\.com.*");
pref("extensions.linkificator@markapola.overrideTextColor", false);
pref("extensions.linkificator@markapola.linkColor", "#006620");
pref("extensions.linkificator@markapola.overrideBackgroundColor", false);
pref("extensions.linkificator@markapola.backgroundColor", "#fff9ab");
pref("extensions.linkificator@markapola.supportEmail", true);
pref("extensions.linkificator@markapola.emailUseTLD", true);
pref("extensions.linkificator@markapola.supportAbout", false);
pref("extensions.linkificator@markapola.supportStandardURLs", true);
pref("extensions.linkificator@markapola.standardURLUseSubdomains", true);
pref("extensions.linkificator@markapola.standardURLUseTLD", true);
pref("extensions.linkificator@markapola.standardURLLinkifyAuthority", false);
pref("extensions.linkificator@markapola.supportInlineElements", true);
pref("extensions.linkificator@markapola.automaticLinkification", true);
pref("extensions.linkificator@markapola.autoLinkificationDelay", 300);
pref("extensions.linkificator@markapola.supportCustomRulesBefore", false);
pref("extensions.linkificator@markapola.supportCustomRulesAfter", false);
pref("extensions.linkificator@markapola.customRules", "{\"beforeList\":[],\"afterList\":[{\"name\":\"URN:NBN Resolver, Redirect to document itself\",\"pattern\":\"urn:nbn:[a-z0-9]{2,}[:-][^[\\\\]{}<>\\\\\\\\|~^\\\"`\\\\s]+\",\"url\":\"http://nbn-resolving.org/redirect/$&\",\"active\":true},{\"name\":\"URN:NBN Resolver, All Links\",\"pattern\":\"urn:nbn:[a-z0-9]{2,}[:-][^[\\\\]{}<>\\\\\\\\|~^\\\"`\\\\s]+\",\"url\":\"http://nbn-resolving.org/$&\",\"active\":false}]}");
pref("extensions.linkificator@markapola.requiredCharacters", ":@/?#");
pref("extensions.linkificator@markapola.protocols", "h..p~http#2;h..ps~https#2;ftp~ftp#2;news~news#0;nntp~nntp#2;telnet~telnet#2;irc~irc#2;file~file#3");
pref("extensions.linkificator@markapola.subdomains", "www~www\\d{0,3}~http://;ftp~ftp~ftp://;irc~irc~irc://");
pref("extensions.linkificator@markapola.excludedElements", "a;applet;area;audio;embed;frame;frameset;head;iframe;img;map;meta;noscript;object;option;param;script;select;style;textarea;title;video;@onclick;@onmousedown;@onmouseup");
pref("extensions.linkificator@markapola.inlineElements", "b;i;big;small;em;strong;tt;span;wbr");
pref("extensions.linkificator@markapola.maxDataSize", 20000);
pref("extensions.linkificator@markapola.sync", false);
pref("extensions.linkificator@markapola.processing", "{\"interval\":10,\"iterations\":40}");
pref("extensions.linkificator@markapola.useGTLDs", true);
pref("extensions.linkificator@markapola.gTLDs", "academy;accountants;active;actor;aero;agency;airforce;archi;army;arpa;asia;associates;attorney;bargains;best;bid;bike;bio;biz;black;blackfriday;blue;boutique;build;builders;buzz;cab;camera;camp;cancerresearch;capital;cards;care;career;careers;cash;cat;catering;center;ceo;cheap;christmas;citic;claims;cleaning;clinic;clothing;club;codes;coffee;college;cologne;com;community;company;computer;construction;contractors;cooking;cool;coop;country;credit;creditcard;cruises;dance;dating;degree;democrat;dental;dentist;desi;diamonds;digital;direct;directory;discount;domains;edu;education;email;engineer;engineering;enterprises;equipment;estate;events;exchange;expert;exposed;fail;farm;feedback;finance;financial;fish;fishing;fitness;flights;florist;foo;foundation;frogans;fund;furniture;futbol;gallery;gift;gives;glass;global;globo;gmo;gop;gov;graphics;gratis;gripe;guitars;guru;haus;hiphop;hiv;holdings;holiday;horse;host;house;immobilien;industries;info;institute;insure;int;international;investments;jetzt;jobs;kaufen;kim;kitchen;kiwi;kred;land;law;lease;lighting;limited;limo;link;loans;lotto;luxe;luxury;management;mango;market;marketing;media;meet;menu;mil;mobi;moda;moe;monash;mortage;museum;name;navy;net;neustar;ninja;onl;org;organic;partners;parts;photo;photography;photos;pics;pictures;pink;plumbing;post;press;pro;productions;properties;pub;qpon;recipes;red;rehab;reisen;ren;rentals;repair;report;rest;reviews;rich;rocks;rodeo;ruhr;ryukyu;saarland;schule;services;sexy;shiksha;shoes;singles;social;software;sohu;solar;solutions;soy;space;supplies;supply;support;surgery;systems;tattoo;tax;technology;tel;tienda;tips;today;tools;town;toys;trade;training;travel;university;uno;vacations;vegas;ventures;vet;viajes;villas;vision;vodka;vote;voting;voto;voyage;wang;watch;webcam;website;wed;wiki;works;wtc;wtf;xxx;xyz;zone");
pref("extensions.linkificator@markapola.useCcTLDs", true);
pref("extensions.linkificator@markapola.ccTLDs", "ac;ad;ae;af;ag;ai;al;am;an;ao;aq;ar;as;at;au;aw;ax;az;ba;bb;bd;be;bf;bg;bh;bi;bj;bm;bn;bo;br;bs;bt;bv;bw;by;bz;ca;cc;cd;cf;cg;ch;ci;ck;cl;cm;cn;co;cr;cu;cv;cw;cx;cy;cz;de;dj;dk;dm;do;dz;ec;ee;eg;er;es;et;eu;fi;fj;fk;fm;fo;fr;ga;gb;gd;ge;gf;gg;gh;gi;gl;gm;gn;gp;gq;gr;gs;gt;gu;gw;gy;hk;hm;hn;hr;ht;hu;id;ie;il;im;in;io;iq;ir;is;it;je;jm;jo;jp;ke;kg;kh;ki;km;kn;kp;kr;kw;ky;kz;la;lb;lc;li;lk;lr;ls;lt;lu;lv;ly;ma;mc;md;me;mg;mh;mk;ml;mm;mn;mo;mp;mq;mr;ms;mt;mu;mv;mw;mx;my;mz;na;nc;ne;nf;ng;ni;nl;no;np;nr;nu;nz;om;pa;pe;pf;pg;ph;pk;pl;pm;pn;pr;ps;pt;pw;py;qa;re;ro;rs;ru;rw;sa;sb;sc;sd;se;sg;sh;si;sj;sk;sl;sm;sn;so;sr;st;su;sv;sx;sy;sz;tc;td;tf;tg;th;tj;tk;tl;tm;tn;to;tp;tr;tt;tv;tw;tz;ua;ug;uk;us;uy;uz;va;vc;ve;vg;vi;vn;vu;wf;ws;ye;yt;za;zm;zw");
pref("extensions.linkificator@markapola.useGeoTLDs", true);
pref("extensions.linkificator@markapola.geoTLDs", "abudhabi;africa;alsace;amsterdam;aquitaine;bar;barcelona;bayern;berlin;boston;brussels;budapest;bzh;capetown;catalonia;colognea;cymru;dohaa;dubai;durban;gent;hamburg;helsinki;istanbul;joburg;koeln;kyoto;london;madrid;melbourne;miami;moscow;nagoya;nrw;nyc;okinawa;osaka;paris;place;quebec;rio;roma;saarland;scot;stockholm;sydney;taipei;tirol;tokyo;vlaanderen;wales;wien;zuerich;yokohama");
pref("extensions.linkificator@markapola.useCommunityTLDs", true);
pref("extensions.linkificator@markapola.communityTLDs", "aco;adac;archi;art;audi;axa;bank;bbb;bmw;bugatti;bzh;catholic;corp;corsica;cpa;cuisinella;eco;edeka;eus;gal;gay;gea;gmbh;gree;green;halal;hotel;ieee;ikano;immo;inc;insurance;islam;ismaili;kids;lamborghini;lds;leclerc;llc;llp;med;merck;mini;mls;mma;music;ngo;nhk;ong;ovh;pars;physio;pharmacy;radio;reit;republican;schmidt;shia;shop;ski;spa;sport;stada;surf;suzuki;swiss;taxi;tatar;tennis;thai;versicherung;webs");
// sync management, deactivated by default
pref("services.sync.prefs.sync.extensions.linkificator@markapola.displayWidget", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.contextMenuIntegration", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.widgetMiddleClick", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.widgetRightClick", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.hotkeyToggle", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.hotkeyManage", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.hotkeyParse", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.useRegExp", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.filterMode", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.whitelist", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.blacklist", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.overrideTextColor", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.linkColor", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.overrideBackgroundColor", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.backgroundColor", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.supportEmail", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.emailUseTLD", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.supportAbout", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.supportStandardURLs", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.standardURLUseSubdomains", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.standardURLUseTLD", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.standardURLLinkifyAuthority", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.supportInlineElements", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.automaticLinkification", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.autoLinkificationDelay", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.supportCustomRulesBefore", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.supportCustomRulesAfter", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.customRules", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.requiredCharacters", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.protocols", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.subdomains", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.excludedElements", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.inlineElements", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.maxDataSize", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.useGTLDs", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.gTLDs", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.useCcTLDs", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.ccTLDs", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.useGeoTLDs", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.geoTLDs", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.useCommunityTLDs", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.communityTLDs", false);
