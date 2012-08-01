
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Linkificator preferences - Linkificator's module
 * author: MarkaPola */

pref("extensions.linkificator@markapola.activated", true);
pref("extensions.linkificator@markapola.hotkey", "control-shift-y");
pref("extensions.linkificator@markapola.displayWidget", true);
pref("extensions.linkificator@markapola.useRegExp", true);
pref("extensions.linkificator@markapola.useWhitelist", false);
pref("extensions.linkificator@markapola.whitelist", "");
pref("extensions.linkificator@markapola.useBlacklist", true);
pref("extensions.linkificator@markapola.blacklist", "localhost www\\.google\\..*");
pref("extensions.linkificator@markapola.overrideTextColor", false);
pref("extensions.linkificator@markapola.linkColor", "#006620");
pref("extensions.linkificator@markapola.overrideBackgroundColor", false);
pref("extensions.linkificator@markapola.backgroundColor", "#fff9ab");
pref("extensions.linkificator@markapola.protocols", "h..p~http#2;h..ps~https#2;ftp~ftp#2;news~news#0;nntp~nntp#2;telnet~telnet#2;irc~irc#2;file~file#3;about~about#0");
pref("extensions.linkificator@markapola.subdomains", "www~www\\d{0,3}~http://;ftp~ftp~ftp://;irc~irc~irc://");
pref("extensions.linkificator@markapola.excludedElements", "a;applet;area;embed;frame;frameset;head;iframe;img;map;meta;noscript;object;option;param;script;select;style;textarea;title;@onclick;@onmousedown;@onmouseup");
