
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
        version: "3.3.3", 
        manual: false, 
        displayBadge: true, 
        contextMenuIntegration: true, 
        widgetMiddleClick: "toggle", 
        widgetRightClick: "none",
        hotKeys: {
            Toggle: "default", 
            Manual: "default", 
            Manage: "default", 
            Update: "default"
        },
        domains: {
            useRegExp: true, 
            type: "black",
            list: {
                white: [], 
                black: [
                    'localhost', 'www\\.google\\..*',
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
                "a", "applet", "area", "audio", "button", "embed", "frame", "frameset", "head",
                "iframe", "img", "input", "map", "meta", "noscript", "object", "option", "param",
                "pre", "script", "select", "style", "textarea", "title", "video",
                "*[boolean(@onclick)]", "*[boolean(@onmousedown)]", "*[boolean(@onmouseup)]",
                "*[contains(@class,'simple-form-fill')]", "*[contains(@class,'ui-helper-hidden-accessible')]"
            ]
        }, 
        tldGenerics: {
            active: true,
            domains: [
                "academy", "accountant", "accountants", "actor", "adult", "aero", "agency", "airforce", "analytics", "app", "army", "arpa", "asia", "associates", "attorney", "auction", "audio", "author", "band", "bargains", "beer", "best", "bid", "bike", "bio", "biz", "black", "blackfriday", "blog", "blue", "boats", "boo", "book", "bot", "boutique", "box", "broker", "build", "builders", "business", "buy", "buzz", "cab", "call", "cam", "camera", "camp", "cancerresearch", "capital", "car", "cards", "care", "career", "careers", "cars", "casa", "cash", "cat", "catering", "center", "ceo", "channel", "charity", "chat", "cheap", "christmas", "church", "circle", "citic", "city", "cityeats", "claims", "cleaning", "click", "clinic", "clothing", "cloud", "club", "codes", "coffee", "college", "com", "community", "company", "compare", "computer", "condos", "construction", "consulting", "contact", "contractors", "cooking", "cool", "coop", "country", "coupons", "courses", "cpa", "credit", "creditcard", "cricket", "cruise", "cruises", "dance", "data", "date", "dating", "day", "deal", "deals", "degree", "delivery", "democrat", "dental", "dentist", "desi", "design", "dev", "diamonds", "diet", "digital", "direct", "directory", "discount", "diy", "docs", "domains", "download", "drive", "earth", "eat", "edu", "education", "email", "energy", "engineer", "engineering", "enterprises", "equipment", "esq", "estate", "events", "exchange", "expert", "exposed", "express", "fail", "family", "farm", "fashion", "feedback", "film", "final", "finance", "financial", "fish", "fishing", "fit", "fitness", "flights", "florist", "flowers", "fly", "foo", "food", "foodnetwork", "forsale", "forum", "foundation", "free", "frogans", "frontdoor", "fun", "fund", "furniture", "futbol", "fyi", "gallery", "game", "games", "garden", "gay", "gift", "gifts", "gives", "giving", "glass", "global", "globo", "gmo", "gop", "got", "gov", "graphics", "gratis", "gripe", "grocery", "group", "guide", "guitars", "guru", "hair", "haus", "health", "healthcare", "help", "here", "hiphop", "hiv", "holdings", "holiday", "homes", "horse", "host", "hosting", "hospital", "hot", "hoteles", "hotels", "house", "how", "immo", "immobilien", "inc", "industries", "info", "ing", "ink", "institute", "insure", "int", "international", "investments", "java", "jetzt", "jewelry", "jobs", "jot", "joy", "juegos", "kaufen", "kim", "kitchen", "kiwi", "kred", "land", "law", "lawyer", "lease", "legal", "life", "lifeinsurance", "lifestyle", "lighting", "like", "limited", "limo", "link", "live", "living", "llc", "loan", "loans", "lotto", "love", "ltd", "luxe", "luxury", "maison", "makeup", "management", "mango", "map", "market", "marketing", "markets", "mba", "med", "media", "meet", "meme", "memorial", "men", "menu", "mobi", "mobile", "moda", "moe", "moi", "monash", "money", "mortgage", "moto", "motorcycles", "mov", "movie", "movistar", "museum", "name", "navy", "net", "network", "neustar", "new", "news", "ninja", "now", "one", "ong", "onl", "online", "org", "organic", "ott", "partners", "parts", "party", "passagens", "pay", "phd", "phone", "photo", "photography", "photos", "pics", "pictures", "pid", "pin", "pink", "play", "plumbing", "porn", "post", "press", "pro", "prod", "productions", "prof", "promo", "properties", "property", "protection", "pub", "qpon", "read", "realestate", "recipes", "red", "rehab", "reise", "reisen", "ren", "rent", "rentals", "repair", "report", "rest", "review", "reviews", "rich", "rip", "rocks", "rodeo", "room", "rsvp", "ruhr", "ryukyu", "safe", "safety", "sale", "salon", "save", "scholarships", "school", "schule", "science", "search", "secure", "security", "services", "sew", "sex", "sexy", "shiksha", "shoes", "shopping", "show", "singles", "site", "skin", "smile", "social", "software", "sohu", "solar", "solutions", "song", "soy", "space", "sport", "spot", "store", "stream", "study", "style", "supplies", "supply", "support", "surgery", "systems", "talk", "tattoo", "tax", "tech", "technology", "tel", "tienda", "tips", "tires", "today", "tools", "top", "town", "toys", "trade", "trading", "training", "travel", "trust", "tube", "tunes", "university", "uno", "vacations", "vegas", "ventures", "versicherung", "vet", "viajes", "video", "villas", "vision", "vodka", "vote", "voting", "voto", "voyage", "vuelos", "wang", "watch", "weather", "webcam", "website", "wed", "wedding", "wiki", "winners", "work", "works", "world", "wow", "wtc", "wtf", "xxx", "xyz", "yachts", "yoga", "you", "yun", "zero", "zip", "zone"
            ]
        },
        tldCountryCodes: {
            active: true,
            domains: [
                "ac", "ad", "ae", "af", "ag", "ai", "al", "am", "ao", "aq", "ar", "as", "at", "au", "aw", "ax", "az", "ba", "bb", "bd", "be", "bf", "bg", "bh", "bi", "bj", "bm", "bn", "bo", "br", "bs", "bt", "bv", "bw", "by", "bz", "ca", "cc", "cd", "cf", "cg", "ch", "ci", "ck", "cl", "cm", "cn", "co", "cr", "cu", "cv", "cw", "cx", "cy", "cz", "de", "dj", "dk", "dm", "do", "dz", "ec", "ee", "eg", "er", "es", "et", "eu", "fi", "fj", "fk", "fm", "fo", "fr", "ga", "gb", "gd", "ge", "gf", "gg", "gh", "gi", "gl", "gm", "gn", "gp", "gq", "gr", "gs", "gt", "gu", "gw", "gy", "hk", "hm", "hn", "hr", "ht", "hu", "id", "ie", "il", "im", "in", "io", "iq", "ir", "is", "it", "je", "jm", "jo", "jp", "ke", "kg", "kh", "ki", "km", "kn", "kp", "kr", "kw", "ky", "kz", "la", "lb", "lc", "li", "lk", "lr", "ls", "lt", "lu", "lv", "ly", "ma", "mc", "md", "me", "mg", "mh", "mk", "ml", "mm", "mn", "mo", "mp", "mq", "mr", "ms", "mt", "mu", "mv", "mw", "mx", "my", "mz", "na", "nc", "ne", "nf", "ng", "ni", "nl", "no", "np", "nr", "nu", "nz", "om", "pa", "pe", "pf", "pg", "ph", "pk", "pl", "pm", "pn", "pr", "ps", "pt", "pw", "py", "qa", "re", "ro", "rs", "ru", "rw", "sa", "sb", "sc", "sd", "se", "sg", "sh", "si", "sj", "sk", "sl", "sm", "sn", "so", "sr", "ss", "st", "su", "sv", "sx", "sy", "sz", "tc", "td", "tf", "tg", "th", "tj", "tk", "tl", "tm", "tn", "to", "tr", "tt", "tv", "tw", "tz", "ua", "ug", "uk", "us", "uy", "uz", "va", "vc", "ve", "vg", "vi", "vn", "vu", "wf", "ws", "ye", "yt", "za", "zm", "zw"
            ]
        }, 
        tldGeographics: {
            active: true,
            domains: [
                "abudhabi", "africa", "alsace", "amsterdam", "bar", "barcelona", "bayern", "berlin", "boston", "brussels", "budapest", "capetown", "cologne", "cymru", "dubai", "durban", "frl", "gent", "hamburg", "helsinki", "ist", "istanbul", "joburg", "koeln", "kyoto", "london", "madrid", "melbourne", "miami", "moscow", "nagoya", "nrw", "nyc", "okinawa", "osaka", "paris", "place", "quebec", "rio", "saarland", "scot", "stockholm", "sydney", "taipei", "tirol", "tokyo", "tui", "vlaanderen", "wales", "wien", "yokohama", "zuerich"
            ]
        }, 
        tldCommunities: {
            active: true,
            domains: [
                "abogado", "agakhan", "akdn", "apartments", "arab", "archi", "art", "auto", "autos", "bank", "baseball", "basketball", "bcn", "bet", "bible", "bingo", "broadway", "bzh", "cafe", "caravan", "casino", "catholic", "cern", "cfd", "chrome", "coach", "corsica", "crs", "dad", "dds", "doctor", "dog", "eco", "edeka", "eurovision", "eus", "faith", "fan", "fans", "football", "gal", "gea", "gmbh", "gold", "golf", "green", "hockey", "ieee", "ikano", "imamat", "insurance", "irish", "ismaili", "lat", "latino", "lds", "lgbt", "lol", "ltda", "mls", "mom", "mormon", "ngo", "ooo", "ovh", "page", "pars", "pet", "pharmacy", "physio", "pizza", "plus", "poker", "racing", "radio", "realtor", "realty", "reit", "republican", "restaurant", "rugby", "run", "sarl", "shia", "shop", "ski", "sky", "soccer", "spreadbetting", "srl", "storage", "studio", "sucks", "surf", "swiss", "tatar", "taxi", "team", "tennis", "theater", "theatre", "tickets", "tours", "vin", "vip", "wanggou", "watches", "whoswho", "win", "wine", "xin"
            ]
        }, 
        tldBrands: {
            active: true,
            domains: [
                "aaa", "aarp", "abarth", "abb", "abbott", "abbvie", "abc", "able", "accenture", "aco", "adac", "ads", "aeg", "aetna", "afamilycompany", "afl", "aig", "aigo", "airbus", "airtel", "alfaromeo", "alibaba", "alipay", "allfinanz", "allstate", "ally", "alstom", "americanexpress", "americanfamily", "amex", "amfam", "amica", "android", "anquan", "anz", "aol", "apple", "aquarelle", "aramco", "arte", "asda", "athleta", "audi", "audible", "auspost", "avianca", "aws", "axa", "azure", "baby", "baidu", "banamex", "bananarepublic", "barclaycard", "barclays", "barefoot", "bauhaus", "bbc", "bbt", "bbva", "bcg", "beats", "beauty", "bentley", "bestbuy", "bharti", "bing", "blockbuster", "bloomberg", "bms", "bmw", "bnpparibas", "boehringer", "bofa", "bom", "bond", "booking", "bosch", "bostik", "bradesco", "bridgestone", "brother", "bugatti", "cal", "calvinklein", "canon", "capitalone", "cartier", "case", "caseih", "cba", "cbn", "cbre", "cbs", "ceb", "cfa", "chanel", "chase", "chintai", "chrysler", "cipriani", "cisco", "citadel", "citi", "clinique", "clubmed", "comcast", "commbank", "comsec", "cookingchannel", "coupon", "creditunion", "crown", "csc", "cuisinella", "cyou", "dabur", "datsun", "dclk", "dealer", "dell", "deloitte", "delta", "dhl", "discover", "dish", "dnp", "dodge", "dot", "dtv", "duck", "dunlop", "dupont", "dvag", "dvr", "emerck", "epson", "ericsson", "erni", "esurance", "etisalat", "everbank", "extraspace", "fage", "fairwinds", "farmers", "fast", "fedex", "ferrari", "ferrero", "fiat", "fidelity", "fido", "fire", "firestone", "firmdale", "flickr", "flir", "ford", "forex", "fox", "fresenius", "frontier", "ftr", "fujitsu", "fujixerox", "gallo", "gallup", "gap", "gbiz", "gdn", "genting", "george", "ggee", "glade", "gle", "gmail", "gmx", "godaddy", "goldpoint", "goo", "goodyear", "goog", "google", "grainger", "guardian", "gucci", "guge", "hangout", "hbo", "hdfc", "hdfcbank", "hermes", "hgtv", "hisamitsu", "hitachi", "hkt", "homedepot", "homegoods", "homesense", "honda", "hotmail", "hsbc", "hughes", "hyatt", "hyundai", "ibm", "icbc", "ice", "icu", "ifm", "imdb", "infiniti", "intel", "intuit", "ipiranga", "itau", "itv", "iveco", "jaguar", "jcb", "jcp", "jeep", "jio", "jlc", "jll", "jmp", "jnj", "jpmorgan", "jprs", "juniper", "kddi", "kerryhotels", "kerrylogistics", "kerryproperties", "kfh", "kia", "kindle", "kinder", "komatsu", "kosher", "kpmg", "kpn", "krd", "kuokgroup", "lacaixa", "ladbrokes", "lamborghini", "lamer", "lancaster", "lancia", "lancome", "landrover", "lanxess", "lasalle", "latrobe", "leclerc", "lefrak", "lego", "lexus", "liaison", "lidl", "lilly", "lincoln", "linde", "lipsy", "lixil", "locker", "locus", "loft", "lotte", "lpl", "lplfinancial", "lundbeck", "lupin", "macys", "maif", "man", "marriott", "marshalls", "maserati", "mattel", "mckinsey", "merckmsd", "metlife", "microsoft", "mini", "mil", "mint", "mit", "mitsubishi", "mlb", "mma", "monster", "mopar", "msd", "mtn", "mutual", "mtr", "nab", "nadex", "nationwide", "natura", "nba", "nec", "netbank", "netflix", "newholland", "next", "nextdirect", "nexus", "nfl", "nhk", "nico", "nike", "nikon", "nissan", "nissay", "nokia", "northwesternmutual", "norton", "nowruz", "nowtv", "nra", "ntt", "obi", "observer", "off", "office", "olayan", "olayangroup", "oldnavy", "ollo", "omega", "onyourside", "open", "oracle", "orange", "origins", "otsuka", "panasonic", "pccw", "pfizer", "philips", "piaget", "pictet", "ping", "pioneer", "playstation", "pnc", "pohl", "politie", "pramerica", "praxi", "prime", "progressive", "pru", "prudential", "pwc", "quest", "qvc", "raid", "redstone", "redumbrella", "reliance", "rexroth", "richardli", "ricoh", "rightathome", "ril", "rmit", "rocher", "rogers", "rwe", "sakura", "samsclub", "samsung", "sandvik", "sandvikcoromant", "sanofi", "sap", "sas", "saxo", "sbi", "sbs", "sca", "scb", "schaeffler", "schmidt", "schwarz", "scjohnson", "scor", "seat", "seek", "select", "sener", "ses", "seven", "sfr", "shangrila", "sharp", "shaw", "shell", "shouji", "showtime", "shriram", "silk", "sina", "skype", "sling", "smart", "sncf", "softbank", "sony", "srt", "stada", "staples", "star", "statebank", "statefarm", "stc", "stcgroup", "suzuki", "swatch", "swiftcover", "symantec", "tab", "taobao", "target", "tatamotors", "tci", "tdk", "telefonica", "temasek", "teva", "thd", "tiaa", "tiffany", "tjmaxx", "tjx", "tkmaxx", "tmall", "toray", "toshiba", "total", "toyota", "travelchannel", "travelers", "travelersinsurance", "trv", "tushu", "tvs", "ubank", "ubs", "uconnect", "unicom", "uol", "ups", "vana", "vanguard", "verisign", "vig", "viking", "virgin", "visa", "vistaprint", "viva", "vivo", "volkswagen", "volvo", "walmart", "walter", "warman", "weatherchannel", "weber", "weibo", "weir", "williamhill", "windows", "wme", "wolterskluwer", "woodside", "xbox", "xerox", "xfinity", "xihuan", "yahoo", "yamaxun", "yandex", "yodobashi", "youtube", "zappos", "zara"
            ]
        },
        extraFeatures: {
            support: {
                inlineElements: true, 
                autoLinkification: true,
                documentReferrer: false
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
                        pattern: "urn:nbn:[a-z0-9]{2,}[:-][^[\\]{}<>\\\\|~^\"`\\s]+",
                        url: "http://nbn-resolving.org/redirect/$&",
                        active: true
                    },
                    {
                        name: "URN:NBN Resolver, All Links",
                        pattern: "urn:nbn:[a-z0-9]{2,}[:-][^[\\]{}<>\\\\|~^\"`\\s]+",
                        url: "http://nbn-resolving.org/$&",
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

    let properties = {sync: false,
                      area: 'local',
                      activated: true};


    let updaters = [
        {
            get name () {
                return 'predefinedRules';
            }, 
            update: function (preference) {
                // remove 'file:///' protocol from protocols list, if any
                let index = preference.protocols.findIndex(protocol => protocol.term === 'file:///');
                if (index != -1) {
                    preference.protocols.splice(index, 1);
                }

                // update excluded elements
                let excludedElements = preference.excludedElements.filter(item => !["*[@onclick]", "*[@onmousedown]", "*[@onmouseup]"].includes(item));
                ["*[boolean(@onclick)]", "*[boolean(@onmousedown)]", "*[boolean(@onmouseup)]",
                 "*[contains(@class,'simple-form-fill')]",
                 "*[contains(@class,'ui-helper-hidden-accessible')]"].forEach(item => {
                     if (!excludedElements.includes(item)) {
                         excludedElements.push(item);
                     }
                 });
                ["button", "input"].forEach(item => {
                    if (!excludedElements.includes(item)) {
                         excludedElements.push(item);
                    }
                });
                preference.excludedElements = excludedElements;
                
                return preference;
            }
        },
        {
            get name () {
                return 'tldGenerics';
            }, 
            update: function (preference) {
                let domains = preference.domains.filter(item => !['active', 'allfinanz', 'mil', 'mortage'].includes(item));
                
                ['blog', 'box', 'cam', 'charity', 'condos', 'consulting', 'cpa', 'cruise', 'data', 'deal',
                 'diy', 'food', 'foodnetwork', 'free', 'frontdoor', 'fun', 'games', 'gay', 'grocery',
                 'hair', 'hospital', 'hot', 'hotels', 'inc', 'ink', 'lawyer', 'lifestyle', 'llc',
                 'maison', 'map', 'marketing', 'mobile', 'mortgage', 'moto', 'now', 'onion', 'ott',
                 'passagens', 'pay', 'phd', 'phone', 'realestate', 'save', 'search', 'secure',
                 'shopping', 'song', 'sport', 'spot', 'store', 'stream', 'talk', 'tunes', 'vuelos',
                 'winners', 'wow', 'you', 'yun'].forEach(item => {
                     if (!domains.includes(item)) {
                         domains.push(item);
                     }
                 });
                preference.domains = domains.sort();
                
                return preference;
            }
        },
        {
            get name () {
                return 'tldCountryCodes';
            },
            update: function (preference) {
                let domains = preference.domains;
                
                ['ss'].forEach(item => {
                    if (!domains.includes(item)) {
                        domains.push(item);
                    }
                });
                preference.domains = domains.sort();

                return preference;
            }
        }, 
        {
            get name () {
                return 'tldGeographics';
            }, 
            update: function (preference) {
                preference.domains  = preference.domains.filter(item => !['aquitaine', 'bzh', 'catalonia', 'doha', 'roma'].includes(item));
                
                return preference;
            }
        }, 
        {
            get name () {
                return 'tldCommunities';
            }, 
            update: function (preference) {
                let domains = preference.domains.filter(item => !['aco', 'android', 'corp', 'cpa', 'gay', 'gree', 'halal', 'hotel', 'immo', 'inc',
                                                                  'islam', 'kids', 'llc', 'llp', 'med', 'music', 'ong', 'spa', 'sport', 'thai',
                                                                  'versicherung', 'webs'].includes(item));
                
                ['agakhan', 'akdn', 'baseball', 'basketball', 'dds', 'doctor', 'imamat', 'latino',
                 'rugby'].forEach(item => {
                     if (!domains.includes(item)) {
                         domains.push(item);
                     }
                 });
                preference.domains = domains.sort();
                
                return preference;
            }
        }, 
        {
            get name () {
                return 'tldBrands';
            }, 
            update: function (preference) {
                let domains = preference.domains.filter(item => !['bbb', 'blanco', 'bnl', 'boots', 'chloe', 'doosan', 'duns', 'edeka', 'epost',
                                                                  'flsmidth', 'goodhands', 'honeywell', 'iinet', 'iselect', 'iwc', 'jlc', 'kddi',
                                                                  'meo', 'merck', 'mobily', 'montblanc', 'mtpc', 'mutuelle', 'pamperedchef',
                                                                  'panerai', 'sakura', 'sapo', 'spiegel', 'starhub', 'statoil', 'telecity',
                                                                  'telephonica', 'vista', 'xperia', 'zippo'].includes(item));
                
                ['abarth', 'abbvie', 'abc', 'able', 'aetna', 'afamilycompany', 'aigo', 'airbus',
                 'alfaromeo', 'allfinanz', 'allstate', 'ally', 'alstom', 'americanexpress',
                 'americanfamily', 'amex', 'amfam', 'android', 'anquan', 'anz', 'aol', 'asda',
                 'athleta', 'audible', 'auspost', 'avianca', 'aws', 'baby', 'banamex',
                 'bananarepublic', 'barefoot', 'bbt', 'bcg', 'beauty', 'bestbuy',
                 'blockbuster', 'bofa', 'booking', 'calvinklein', 'capitalone', 'case', 'caseih',
                 'cbre', 'cbs', 'chase', 'chintai', 'chrysler', 'citadel', 'citi', 'comcast',
                 'cookingchannel', 'coupon', 'dhl', 'discover', 'dish', 'dnp', 'dodge', 'dot',
                 'dtv', 'duck', 'dunlop', 'dupont', 'dvr', 'ericsson', 'esurance',
                 'etisalat', 'extraspace', 'farmers', 'fedex', 'ferrari', 'fiat', 'fidelity',
                 'fido', 'fire', 'flickr', 'flir', 'ftr', 'fujitsu', 'fujixerox', 'gallo', 'gallup',
                 'gap', 'george', 'glade', 'godaddy', 'goodyear', 'guardian', 'hbo',
                 'hdfc', 'hdfcbank', 'hgtv', 'hisamitsu', 'hkt', 'homegoods', 'homesense',
                 'hughes', 'hyatt', 'imdb', 'intel', 'intuit', 'itv', 'iveco', 'jcp',
                 'jeep', 'jio', 'jnj', 'jpmorgan', 'juniper', 'kddi', 'kerryhotels',
                 'kerrylogistics', 'kerryproperties', 'kindle', 'kosher', 'kpmg', 'kuokgroup',
                 'ladbrokes', 'lamborghini', 'lancia', 'lancome', 'lefrak', 'lego', 'lilly',
                 'lipsy', 'locker', 'locus', 'loft', 'lpl', 'lplfinancial', 'lundbeck', 'macys',
                 'marshalls', 'maserati', 'mattel', 'mckinsey', 'merckmsd', 'metlife', 'mil',
                 'mint', 'mit', 'mitsubishi', 'mlb', 'monster', 'mopar', 'msd', 'mutual', 'nab',
                 'nationwide', 'natura', 'nba', 'netflix', 'newholland', 'next', 'nextdirect',
                 'nfl', 'nike', 'nissay', 'northwesternmutual', 'nowtv', 'observer', 'off',
                 'olayan', 'olayangroup', 'oldnavy', 'ollo', 'onyourside', 'open', 'panasonic',
                 'pccw', 'pfizer', 'pioneer', 'pnc', 'politie', 'pramerica', 'prime', 'progressive',
                 'pru', 'prudential', 'pwc', 'qvc', 'raid', 'reliance', 'richardli', 'rightathome',
                 'ril', 'rmit', 'rogers', 'sakura', 'samsclub', 'sbi', 'scjohnson'].forEach(item => {
                     if (!domains.includes(item)) {
                         domains.push(item);
                     }
                 });
                preference.domains = domains.sort();
                
                return preference;
            }
        }
    ];
    
        
    class ConfiguratorManager {
        constructor () {
        }

        // TEMPORARY: to update properties from legacy part
        updateProperties (preferences) {
            properties.sync = preferences.config.sync;
            properties.area = preferences.config.sync ? 'sync' : 'local';
            properties.activated = preferences.config.activated;

            browser.storage[properties.area].set(preferences.settings).then(() => {
                browser.storage.local.set(preferences.config);
            }).catch(reason => console.error(reason));
        }
        
        linkifyURL (url) {
            if (properties.domains.type === 'none')
			    return true;

		    let useRegExp = properties.domains.useRegExp;
            let flag = properties.domains.type === 'white';
		    let list = properties.domains.list[properties.domains.type];

		    let index = 0;
		    while (index != list.length) {
			    if (useRegExp) {
				    if (url.match(new RegExp(list[index++], "i"))) {
					    return flag;
				    }
			    } else {
				    if (url.toLowerCase().indexOf(list[index++]) != -1) {
					    return flag;
				    }
			    }
		    }
		    
            return !flag;
        }
    }


    function setPreferences () {
        return browser.storage[properties.area].get().then(result => {
            result.area = properties.area;
            result.activated = properties.activated;
            properties = result;

            if (!properties.version) {
                properties.version = '3.0.0';
            }
            
            // initialized undefined preferences
            for (let preference in defaultPreferences) {
                if (!properties.hasOwnProperty(preference)) {
                    properties[preference] = defaultPreferences[preference];
                }
            }

            // update preferences, if required
            if (properties.version !== defaultPreferences.version) {
                for (let updater of updaters) {
                    let name = updater.name;
                    properties[name] = updater.update(properties[name]);
                }
                properties.version = defaultPreferences.version;
            }
            
            // update shortcuts definitions if needed
            if (properties.hotKeys.hasOwnProperty('toggle')) {
                // clean-up properties coming from legacy
                delete properties.hotKeys.toggle;
                delete properties.hotKeys.manual;
                delete properties.hotKeys.manage;
                delete properties.hotKeys.parse;
            }
            for (let hotKey in properties.hotKeys) {
                if (properties.hotKeys[hotKey] != 'default') {
                    try {
                        browser.commands.update({name: hotKey, shortcut: properties.hotKeys[hotKey]});
                    } catch(error) {
                        // shortcut is invalid, fallback to default
                        ShortcutCustomizeUI.setDefaultShortcut(hotKey);
                        properties.hotKeys[hotKey] = 'default';
                    }
                }
            }
            
            let settings = Object.assign({}, properties);
            delete settings.area;
            delete settings.activated;
            delete settings.sync;
            //let {area, activated, sync, ...settings} = properties;
            return browser.storage[properties.area].set(settings).then(() => {
                return properties;
            });
        });
    }

    function initializeShortcuts () {
        const SHORTCUTS_VERSION = 1;
        return browser.storage.local.get({ shortcutCustomizeUIVersion: 0 }).then(result => {
            switch (result.shortcutCustomizeUIVersion) {
            case 0: // on initial startup
                ShortcutCustomizeUI.setDefaultShortcuts();
            }
            return browser.storage.local.set({ shortcutCustomizeUIVersion: SHORTCUTS_VERSION });
        });
    }
    
    function initializePreferences () {
        return setPreferences().then(properties => {
            // can now attach handle to manage preferences changes
            browser.storage.onChanged.addListener((changes, area) => {
                if (area === 'local') {
                    if (changes.hasOwnProperty('activated')) {
                        properties.activated = changes.activated.newValue;
                    }
                    
                    if (changes.hasOwnProperty('sync')) {
                        properties.sync = changes.sync.newValue;
                        properties.area = changes.sync.newValue ? 'sync' : 'local';
                        if (properties.area === 'sync') {
                            // retrieve sync values
                            setPreferences();
                        } else {
                            // propagate current settings to local
                            let settings = Object.assign({}, properties);
                            delete settings.area;
                            delete settings.sync;
                            //let {area, sync, ...settings} = properties;
                            browser.storage.local.set(settings);
                        }

                        return;
                    }
                }
                
                if (area === properties.area) {
                    for (let key in changes) {
                        properties[key] =  changes[key].newValue;
                    }
                }
            });
            
            return {configurator: new ConfiguratorManager(), properties: properties};
        });
    }
    
    // handle preferences management events
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.id) {
        case 'reset-defaults':
            browser.storage[properties.area].set(defaultPreferences).then(result => {
                sendResponse({id: 'reset-defaults', done: true});
            }).catch(reason => {
                console.error(reason);
                sendResponse({id: 'reset-defaults', done: false});
            });
        break;
        case 'reset-requiredCharacters':
            browser.storage[properties.area].set({requiredCharacters: defaultPreferences.requiredCharacters}).catch(reason => console.error(reason));
            break;
        case 'reset-protocols':
        case 'reset-subdomains':
        case 'reset-excludedElements':
            {
                let id = message.id.substring(6);
                let preferences = properties.predefinedRules;
                preferences[id] = defaultPreferences.predefinedRules[id];
                browser.storage[properties.area].set({predefinedRules: preferences}).catch(reason => console.error(reason));
            }
            break;
        case 'reset-inlineElements':
        case 'reset-maxDataSize':
            {
                let id = message.id.substring(6);
                let preferences = properties.extraFeatures;
                preferences[id] = defaultPreferences.extraFeatures[id];
                browser.storage[properties.area].set({extraFeatures: preferences}).catch(reason => console.error(reason));
            }
            break;
        case 'reset-tldGenerics':
        case 'reset-tldCountryCodes':
        case 'reset-tldGeographics':
        case 'reset-tldCommunities':
        case 'reset-tldBrands':
            {
                let id = message.id.substring(6);
                properties[id].domains = defaultPreferences[id].domains;
                browser.storage[properties.area].set({[id]: properties[id]}).catch(reason => console.error(reason));
            }
            break;
        }        
    });

    
    return browser.storage.local.get(['sync', 'activated']).then(result => {
        if (result.hasOwnProperty('sync')) {
            properties.sync = result.sync;
            properties.area = result.sync ? 'sync' : 'local';
        } else {
            browser.storage.local.set({sync: properties.sync}).catch(reason => console.error(reason));
        }
        if (result.hasOwnProperty('activated')) {
            properties.activated = result.activated;
        } else {
            browser.storage.local.set({activated: properties.activated}).catch(reason => console.error(reason));
        }
        
        return initializeShortcuts().then(() => {
            return initializePreferences();
        }).catch(reason => console.error(reason));
    });
}
