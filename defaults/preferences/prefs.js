
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
pref("extensions.linkificator@markapola.blacklist", "^about: localhost www\\.google\\..*");
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
pref("extensions.linkificator@markapola.topLevelDomains", "ac;ad;ae;aero;af;ag;ai;al;am;an;ao;aq;ar;arpa;as;asia;at;au;aw;ax;az;ba;bb;bd;be;bf;bg;bh;bi;biz;bj;bl;bm;bn;bo;bq;br;bs;bt;bv;bw;by;bz;ca;cat;cc;cd;cf;cg;ch;ci;ck;cl;cm;cn;co;com;coop;cr;cu;cv;cw;cx;cy;cz;de;dj;dk;dm;do;dz;ec;edu;ee;eg;eh;er;es;et;eu;fi;fj;fk;fm;fo;fr;ga;gb;gd;ge;gf;gg;gh;gi;gl;gm;gn;gov;gp;gq;gr;gs;gt;gu;gw;gy;hk;hm;hn;hr;ht;hu;id;ie;il;im;in;info;int;io;iq;ir;is;it;je;jm;jo;jobs;jp;ke;kg;kh;ki;km;kn;kp;kr;kw;ky;kz;la;lb;lc;li;lk;lr;ls;lt;lu;lv;ly;ma;mc;md;me;mf;mg;mh;mil;mk;ml;mm;mn;mo;mobi;mp;mq;mr;ms;mt;mu;museum;mv;mw;mx;my;mz;na;name;nc;ne;net;nf;ng;ni;nl;no;np;nr;nu;nz;om;org;pa;pe;pf;pg;ph;pk;pl;pm;pn;post;pr;pro;ps;pt;pw;py;qa;re;ro;rs;ru;rw;sa;sb;sc;sd;se;sg;sh;si;sj;sk;sl;sm;sn;so;sr;ss;st;su;sv;sx;sy;sz;tc;td;tel;tf;tg;th;tj;tk;tl;tm;tn;to;tp;tr;travel;tt;tv;tw;tz;ua;ug;uk;um;us;uy;uz;va;vc;ve;vg;vi;vn;vu;wf;ws;xxx;ye;yt;za;zm;zw");
pref("extensions.linkificator@markapola.excludedElements", "a;applet;area;embed;frame;frameset;head;iframe;img;map;meta;noscript;object;option;param;script;select;style;textarea;title;@onclick;@onmousedown;@onmouseup");
pref("extensions.linkificator@markapola.inlineElements", "b;i;big;small;em;strong;tt;span;wbr");
pref("extensions.linkificator@markapola.sync", false);
pref("extensions.linkificator@markapola.processing", "{\"interval\":10,\"iterations\":40}");
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
pref("services.sync.prefs.sync.extensions.linkificator@markapola.topLevelDomains", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.excludedElements", false);
pref("services.sync.prefs.sync.extensions.linkificator@markapola.inlineElements", false);
