
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// configurator.js - Linikificator's module
// author: MarkaPola

//
// Manage all settings/options/properties of the add-on
//

function Configurator () {
    // Initialization of preferences
    let defaultPreferences = {
        activated: true,
        manual: false, 
        displayBadge: true, 
        contextMenuIntegration: true, 
        widgetMiddleClick: "toggle", 
        widgetRightClick: "none",
        hotKeys: {
            name: "toggle", 
            value: "control-shift-y", 
            toggle: "control-shift-y", 
            manual: "control-shift-o", 
            manage: "control-shift-x", 
            parse: "control-shift-u"
        },
        domains: {
            useRegExp: true, 
            type: "black",
            list: {
                white: [], 
                black: [
                    '^about:', 'localhost', 'www\\.google\\..*',
                    'encrypted\\.google\\.com', 'www\\.yahoo\\..*',
                    'www\\.yandex\\..*', 'www\\.deezer\\.com.*'
                ]
            }
        },
        style: {
            text: {
                override: false, 
                color: "#006620"
            },
            background: {
                override: false, 
                color: "#fff9ab"
            }
        },
        requiredCharacters: [":", "@", "/", "?", "#"],
        predefinedRules: {
            support: {
                email: {
                    active: true, 
                    useTLD: true
                },
                about: {
                    active: true
                },
                standard: {
                    active: true,
                    useSubdomains: true, 
                    useTLD: true, 
                    linkifyAuthority: false
                }
            },
            protocols: [
                {
                    pattern: "h..p://",
                    term: "http://"
                },
                {
                    pattern: "h..ps://",
                    term: "https://"
                },
                {
                    pattern: "ftp://",
                    term: "ftp://"
                },
                {
                    pattern: "nntp://",
                    term: "nntp://"
                },
                {
                    pattern: "telnet://",
                    term: "telnet://"
                },
                {
                    pattern: "irc://",
                    term: "irc://"
                },
                {
                    pattern: "file:///",
                    term: "file:///"
                }
            ], 
            subdomains: [
                {
                    filter: "www",
                    pattern: "www\\d{0,3}",
                    term: "http://"
                },
                {
                    filter: "ftp",
                    pattern: "ftp",
                    term: "ftp://"
                },
                {
                    filter: "irc",
                    pattern: "irc",
                    term: "irc://"
                }
            ], 
            excludedElements: [
                "a", "applet", "area", "audio", "embed", "frame", "frameset", "head",
                "iframe", "img", "map", "meta", "noscript", "object", "option", "param",
                "pre", "script", "select", "style", "textarea", "title", "video",
                "^[@onclick]", "^[@onmousedown]", "^[@onmouseup]"
            ],
            topLevelDomains: {
                gTLDs: {
                    active: true,
                    domains: [
                        "academy", "accountant", "accountants", "active", "actor", "adult", "aero", "agency", "airforce", "allfinanz", "analytics", "app", "army", "arpa", "asia", "associates", "attorney", "auction", "audio", "author", "band", "bargains", "beer", "best", "bid", "bike", "bio", "biz", "black", "blackfriday", "blue", "boats", "boo", "book", "bot", "boutique", "broker", "build", "builders", "business", "buy", "buzz", "cab", "call", "camera", "camp", "cancerresearch", "capital", "cards", "car", "care", "career", "careers", "cars", "casa", "cash", "cat", "catering", "center", "ceo", "channel", "chat", "cheap", "christmas", "church", "circle", "citic", "city", "cityeats", "claims", "cleaning", "click", "clinic", "clothing", "cloud", "club", "codes", "coffee", "college", "com", "community", "company", "compare", "computer", "construction", "contact", "contractors", "cooking", "cool", "coop", "country", "coupons", "courses", "credit", "creditcard", "cricket", "cruises", "dance", "date", "dating", "day", "deals", "degree", "delivery", "democrat", "dental", "dentist", "desi", "design", "dev", "diamonds", "diet", "digital", "direct", "directory", "discount", "docs", "domains", "download", "drive", "earth", "eat", "edu", "education", "email", "energy", "engineer", "engineering", "enterprises", "equipment", "esq", "estate", "events", "exchange", "expert", "exposed", "express", "fail", "family", "farm", "fashion", "feedback", "film", "final", "finance", "financial", "fish", "fishing", "fit", "fitness", "flights", "florist", "flowers", "fly", "foo", "forsale", "forum", "foundation", "frogans", "fund", "furniture", "futbol", "fyi", "gallery", "game", "garden", "gift", "gifts", "gives", "giving", "glass", "global", "globo", "gmo", "gop", "got", "gov", "graphics", "gratis", "gripe", "group", "guide", "guitars", "guru", "haus", "health", "healthcare", "help", "here", "hiphop", "hiv", "holdings", "holiday", "homes", "horse", "host", "hosting", "hoteles", "house", "how", "immo", "immobilien", "industries", "info", "ing", "institute", "insure", "int", "international", "investments", "java", "jetzt", "jewelry", "jobs", "jot", "joy", "juegos", "kaufen", "kim", "kitchen", "kiwi", "kred", "land", "law", "lease", "legal", "life", "lifeinsurance", "lighting", "like", "limited", "limo", "link", "live", "living", "loan", "loans", "lotto", "love", "ltd", "luxe", "luxury", "makeup", "management", "mango", "market", "markets", "marketing", "mba", "med", "media", "meet", "meme", "memorial", "men", "menu", "mil", "mobi", "moda", "moe", "moi", "monash", "money", "mortage", "museum", "motorcycles", "mov", "movie", "movistar", "name", "navy", "net", "network", "neustar", "new", "news", "ninja", "one", "ong", "onl", "online", "org", "organic", "partners", "parts", "party", "photo", "photography", "photos", "pics", "pictures", "pin", "pid", "pink", "play", "plumbing", "porn", "post", "press", "pro", "prod", "productions", "prof", "promo", "properties", "property", "protection", "pub", "qpon", "read", "recipes", "red", "rehab", "reise", "reisen", "ren", "rent", "rentals", "repair", "report", "rest", "review", "reviews", "rich", "rip", "rocks", "rodeo", "room", "rsvp", "ruhr", "ryukyu", "safe", "safety", "sale", "salon", "scholarships", "school", "science", "schule", "security", "services", "sew", "sex", "sexy", "shiksha", "shoes", "show", "singles", "site", "skin", "smile", "social", "software", "sohu", "solar", "solutions", "soy", "space", "study", "style", "supplies", "supply", "support", "surgery", "systems", "tattoo", "tax", "tech", "technology", "tel", "tienda", "tips", "tires", "today", "tools", "top", "town", "toys", "trade", "trading", "training", "travel", "trust", "tube", "university", "uno", "vacations", "vegas", "ventures", "versicherung", "vet", "viajes", "video", "villas", "vision", "vodka", "vote", "voting", "voto", "voyage", "wang", "watch", "weather", "webcam", "website", "wed", "wedding", "wiki", "work", "works", "world", "wtc", "wtf", "xxx", "xyz", "yachts", "yoga", "zero", "zip", "zone"
                    ]
                },
                ccTLDs: {
                    active: true,
                    domains: [
                        "ac", "ad", "ae", "af", "ag", "ai", "al", "am", "ao", "aq", "ar", "as", "at", "au", "aw", "ax", "az", "ba", "bb", "bd", "be", "bf", "bg", "bh", "bi", "bj", "bm", "bn", "bo", "br", "bs", "bt", "bv", "bw", "by", "bz", "ca", "cc", "cd", "cf", "cg", "ch", "ci", "ck", "cl", "cm", "cn", "co", "cr", "cu", "cv", "cw", "cx", "cy", "cz", "de", "dj", "dk", "dm", "do", "dz", "ec", "ee", "eg", "er", "es", "et", "eu", "fi", "fj", "fk", "fm", "fo", "fr", "ga", "gb", "gd", "ge", "gf", "gg", "gh", "gi", "gl", "gm", "gn", "gp", "gq", "gr", "gs", "gt", "gu", "gw", "gy", "hk", "hm", "hn", "hr", "ht", "hu", "id", "ie", "il", "im", "in", "io", "iq", "ir", "is", "it", "je", "jm", "jo", "jp", "ke", "kg", "kh", "ki", "km", "kn", "kp", "kr", "kw", "ky", "kz", "la", "lb", "lc", "li", "lk", "lr", "ls", "lt", "lu", "lv", "ly", "ma", "mc", "md", "me", "mg", "mh", "mk", "ml", "mm", "mn", "mo", "mp", "mq", "mr", "ms", "mt", "mu", "mv", "mw", "mx", "my", "mz", "na", "nc", "ne", "nf", "ng", "ni", "nl", "no", "np", "nr", "nu", "nz", "om", "pa", "pe", "pf", "pg", "ph", "pk", "pl", "pm", "pn", "pr", "ps", "pt", "pw", "py", "qa", "re", "ro", "rs", "ru", "rw", "sa", "sb", "sc", "sd", "se", "sg", "sh", "si", "sj", "sk", "sl", "sm", "sn", "so", "sr", "st", "su", "sv", "sx", "sy", "sz", "tc", "td", "tf", "tg", "th", "tj", "tk", "tl", "tm", "tn", "to", "tr", "tt", "tv", "tw", "tz", "ua", "ug", "uk", "us", "uy", "uz", "va", "vc", "ve", "vg", "vi", "vn", "vu", "wf", "ws", "ye", "yt", "za", "zm", "zw"
                    ]
                }, 
                geoTLDs: {
                    active: true,
                    domains: [
                        "abudhabi", "africa", "alsace", "amsterdam", "aquitaine", "bar", "barcelona", "bayern", "berlin", "boston", "brussels", "budapest", "bzh", "capetown", "catalonia", "cologne", "cymru", "doha", "dubai", "durban", "frl", "gent", "hamburg", "helsinki", "ist", "istanbul", "joburg", "koeln", "kyoto", "london", "madrid", "melbourne", "miami", "moscow", "nagoya", "nrw", "nyc", "okinawa", "osaka", "paris", "place", "quebec", "rio", "roma", "saarland", "scot", "stockholm", "sydney", "taipei", "tirol", "tokyo", "tui", "vlaanderen", "wales", "wien", "zuerich", "yokohama"
                    ]
                }, 
                communityTLDs: {
                    active: true,
                    domains: [
                        "abogado", "aco", "android", "apartments", "archi", "art", "auto", "autos", "bank", "bcn", "bet", "bible", "bingo", "broadway", "bzh", "cafe", "caravan", "casino", "catholic", "cern", "cfd", "chrome", "coach", "corp", "corsica", "cpa", "crs", "dad", "dog", "eco", "edeka", "eurovision", "eus", "faith", "fan", "fans", "football", "gal", "gay", "gea", "gmbh", "gold", "golf", "gree", "green", "halal", "hockey", "hotel", "ieee", "ikano", "immo", "inc", "insurance", "irish", "islam", "ismaili", "kids", "lat", "lds", "lgbt", "llc", "llp", "lol", "ltda", "med", "mls", "mom", "mormon", "music", "ngo", "ong", "ooo", "ovh", "page", "pars", "pet", "pharmacy", "physio", "pizza", "plus", "poker", "racing", "radio", "realtor", "realty", "reit", "republican", "restaurant", "run", "sarl", "shia", "shop", "ski", "sky", "soccer", "spa", "sport", "spreadbetting", "srl", "storage", "studio", "sucks", "surf", "swiss", "taxi", "tatar", "team", "tennis", "thai", "theater", "theatre", "tickets", "tours", "versicherung", "vin", "vip", "wanggou", "watches", "webs", "whoswho", "win", "wine", "xin"
                    ]
                }, 
                brandTLDs: {
                    active: true,
                    domains: [
                        "aaa", "aarp", "abb", "abbott", "accenture", "aco", "adac", "ads", "aeg", "afl", "aig", "airtel", "alibaba", "alipay", "amica", "apple", "aquarelle", "aramco", "arte", "audi", "axa", "azure", "baidu", "barclaycard", "barclays", "bauhaus", "bbb", "bbc", "bbva", "beats", "bentley", "bharti", "bing", "bloomberg", "bms", "bmw", "bnl", "bnpparibas", "boehringer", "bom", "bond", "boots", "bosch", "bostik", "bradesco", "bridgestone", "brother", "bugatti", "cal", "canon", "cartier", "cba", "cbn", "ceb", "cfa", "chanel", "chloe", "cipriani", "cisco", "clinique", "clubmed", "commbank", "comsec", "creditunion", "crown", "csc", "cuisinella", "cyou", "dabur", "datsun", "dclk", "dealer", "dell", "deloitte", "delta", "doosan", "dvag", "edeka", "emerck", "epson", "erni", "everbank", "fage", "fairwinds", "fast", "ferrero", "firestone", "firmdale", "flsmidth", "ford", "forex", "fox", "fresenius", "frontier", "gbiz", "gdn", "genting", "ggee", "gle", "gmail", "gmx", "goldpoint", "goo", "goog", "google", "grainger", "gucci", "guge", "hangout", "hermes", "hitachi", "homedepot", "honda", "hotmail", "hsbc", "hyundai", "ibm", "icbc", "ice", "icu", "ifm", "iinet", "infiniti", "ipiranga", "iselect", "itau", "iwc", "jaguar", "jcb", "jlc", "jll", "jmp", "jprs", "kfh", "kia", "kddi", "kinder", "komatsu", "kpn", "krd", "lacaixa", "lamer", "lamborghini", "lancaster", "landrover", "lanxess", "lasalle", "latrobe", "leclerc", "lexus", "liaison", "lidl", "lincoln", "linde", "lixil", "lotte", "lupin", "maif", "man", "marriott", "meo", "merck", "microsoft", "mini", "mma", "mobily", "montblanc", "mtn", "mtpc", "mtr", "mutuelle", "nadex", "nec", "netbank", "nexus", "nhk", "nico", "nikon", "nissan", "nokia", "norton", "nowruz", "nra", "ntt", "obi", "office", "omega", "oracle", "orange", "origins", "otsuka", "pamperedchef", "panerai", "philips", "piaget", "pictet", "ping", "playstation", "pohl", "praxi", "quest", "redstone", "redumbrella", "rexroth", "ricoh", "rocher", "rwe", "samsung", "sakura", "sandvik", "sandvikcoromant", "sanofi", "sap", "sapo", "sas", "saxo", "sbs", "sca", "scb", "schaeffler", "schmidt", "schwarz", "scor", "seat", "seek", "select", "sener", "seven", "sfr", "sharp", "shell", "shriram", "skype", "sncf", "softbank", "sony", "spiegel", "stada", "star", "starhub", "statefarm", "statoil", "stc", "stcgroup", "suzuki", "swatch", "symantec", "tab", "taobao", "tatamotors", "tci", "telephonica", "temasek", "thd", "tiffany", "tmall", "toray", "toshiba", "toyota", "travelers", "travelersinsurance", "trv", "tushu", "ubs", "unicom", "uol", "vana", "verisign", "virgin", "vista", "vistaprint", "viva", "volkswagen", "walter", "weatherchannel", "weber", "weir", "williamhill", "windows", "wme", "xbox", "xerox", "xperia", "yamaxun", "yandex", "yodobashi", "youtube", "zara"
                    ]
                }
            }
        },
        extraFeatures: {
            support: {
                inlineElements: true, 
                automaticLinkification: true
            },
            inlineElements: [
                "b", "i", "big", "small", "em", "strong", "tt", "span", "wbr"
            ], 
            maxDataSize: 20000, 
            autoLinkification: {
                delay: 300, 
                interval: {
                    active: true, 
                    value: 2000
                },
                threshold: {
                    active: true, 
                    value: 500
                }
            }
        }, 
        customRules: {
            support: {
                before: false,
                after: false
            }, 
            rules: {
                beforeList: [],
                afterList: [
                    {
                        name: "URN:NBN Resolver, Redirect to document itself",
                        pattern: "urn:nbn:[a-z0-9]{2,}[:-][^[\\\\]{}<>\\\\\\\\|~^\\\"`\\\\s]+",
                        url: "http://nbn-resolving.org/redirect/$&",
                        active: true
                    },
                    {
                        name: "URN:NBN Resolver, All Links",
                        pattern: "urn:nbn:[a-z0-9]{2,}[:-][^[\\\\]{}<>\\\\\\\\|~^\\\"`\\\\s]+\",\"url\":\"http://nbn-resolving.org/$&",
                        active: false
                    }
                ]
            }
        }, 
        processing: {
            interval: 10,
            iterations: 40
        }
    };

    let properties = {area: 'local',
                      activated: true};


    function initializePreferences ()
    {
        return browser.storage[properties.area].get().then(result => {
            properties = result;
            properties.area = properties.area;
            
            // initialized undefined preferences
            for (let preference in defaultPreferences) {
                if (!properties.hasOwnProperty(preference)) {
                    properties[preference] = defaultPreferences[preference];
                }
            }

            return browser.storage[properties.area].set(properties).then(() => {
                return new Promise((resolve, reject) => {
                    resolve(properties);
                });
            });
        });
    }
    
    // handle preferences changes
    browser.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.hasOwnProperty('activated')) {
            properties.activated = changes.activated.newValue;
        }
        
        if (area === properties.area) {
            for (let key in changes) {
                properties[key] =  changes[key].newValue;
            }
        }
    });

    // handle preferences management events
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.id) {
        case 'change-area':
            browser.storage.local.set({sync: message.sync}).then(result => {
                properties.area = message.sync ? 'sync' : 'local';

                initializePreferences().then(result => {
                    sendResponse({id: 'change-area'});
                });
            }).catch(reason => console.error(reason));
            break;
        case 'reset-defaults':
            browser.storage[properties.area].set(defaultPreferences).then(result => {
                sendResponse({id: 'reset-defaults'});
            }).catch(reason => console.error(reason));
            break;
        }        
    });

    
    return browser.storage.local.get(['sync', 'activated']).then(result => {
        if (result.sync === undefined) {
            properties.area = 'local';
            browser.storage.local.set({sync: false}).catch(reason => console.error(reason));
        } else {
            properties.area = result.sync ? 'sync' : 'local';
        }
        if (result.activated === undefined) {
            properties.activaed = true;
            browser.storage.local.set({activated: true}).catch(reason => console.error(reason));
        } else {
            properties.activated = result.activated;
        }
        
        return initializePreferences();
    });
}
