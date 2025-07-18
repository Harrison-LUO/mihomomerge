function main(config, profileName) {

    // 添加UPC认证DNS
    modifyConfigByPath(config, "dns.nameserver-policy", null, null, 'wlan.upc.edu.cn', ['121.251.251.251', '121.251.251.250']);
    modifyConfigByPath(config, "dns.nameserver-policy", null, null, 'lan.upc.edu.cn', ['121.251.251.251', '121.251.251.250']);
    modifyConfigByPath(config, "dns.nameserver-policy", null, null, 'v.upc.edu.cn', ['121.251.251.251', '121.251.251.250']);

    // 移除system规则
    updateDNS(config, [
        ["proxy-server-nameserver", "system"],
        ["default-nameserver", "system"],
        ["nameserver", "system"]
    ], true);

    // // 添加DH-DNS上海
    // updateDNS(config, [
    //     ["proxy-server-nameserver", "https://dh-dns.global-idt.net/dns-query#RULES&h3=true&skip-cert-verify=true"],
    //     ["fallback", "https://dh-dns.global-idt.net/dns-query#RULES&h3=true&skip-cert-verify=true"]
    // ]);
    // // 添加DH-DNS北京
    // updateDNS(config, [
    //     ["proxy-server-nameserver", "https://north.dh-global-team.net:438/dns-query#RULES&h3=true&skip-cert-verify=true"],
    //     ["fallback", "https://north.dh-global-team.net:438/dns-query#RULES&h3=true&skip-cert-verify=true"]
    // ]);
    
    // 强制嗅探访问
    modifyConfigByPath(config, "sniffer", null, null, "override-destination", true);

    // 修改大流量负载均衡顺序美国优先
    sortProxiesInGroup(config, /大流量故障转移/, [/美国|US/i, /新加坡|SG/i]);
    
    //修改节点 IP 版本

    updateProxyOption(config, "name", /自建D/, "ip-version", "ipv6-prefer");

    // 关闭自建落地TCP快速打开
    updateProxyOption(config, "name", /自建L/, "tfo", false);

    // 设置dialer-proxy
    // updateDialerProxyGroup(config, [
    //     ["🛬 新加坡落地", "🇸🇬 新加坡节点", "🦁 新加坡自建落地"],
    //     ["🛬 美国落地", "🇺🇲 美国节点", "💵 美国自建落地"],
    //     ["🛬 日本落地", "🇯🇵 日本节点", "🎎 日本自建落地"],
    //     ["🛬 香港落地", "🇭🇰 香港节点", "🌷 香港自建落地"],
    //     ["🛬 湾湾落地", "🐉 湾湾节点", "🍍 湾湾自建落地"],
    //     ["🛬 西北欧落地", "🇪🇺 西北欧节点", "🗼 西北欧自建落地"],
    //     ["🛬 英国落地", "🇬🇧 英国节点", "💂 英国自建落地"]
    // ]);
    updateDialerProxyGroup(config, [
        ["🛬 新加坡落地", "🇸🇬 新加坡节点", "🦁 新加坡自建落地"],
        ["🛬 美国落地", "🇺🇲 美国节点", "💵 美国自建落地"],
        ["🛬 日本落地", "🇯🇵 日本节点", "🎎 日本自建落地"],
        ["🛬 香港落地", "🇭🇰 香港节点", "🌷 香港自建落地"],
        ["🛬 湾湾落地", "🌷 香港自建落地", "🍍 湾湾自建落地"],
        ["🛬 西北欧落地", "🇪🇺 西北欧节点", "🗼 西北欧自建落地"],
        ["🛬 英国落地", "🗼 西北欧自建落地", "💂 英国自建落地"]
    ]);
    removeGroupsByRegex(config, /任选前置/);
    removeProxiesByRegex(config, /任选前置/);
    removeGroupsByRegex(config, /任选落地/);
    removeProxiesByRegex(config, /任选落地/);
    updateGroupOption(config, "type", ["load-balance"], "strategy", "round-robin");

    // 修改节点dialer-proxy (正则匹配)
    updateProxyOption(config, "name", /JP穿透SS-/, "dialer-proxy", "🇯🇵 日本节点");
    updateProxyOption(config, "name", /HK穿透SS-/, "dialer-proxy", "🇭🇰 香港节点");
    updateProxyOption(config, "name", /US穿透SS-/, "dialer-proxy", "🇺🇲 美国节点");
    updateProxyOption(config, "name", /SG穿透SS-/, "dialer-proxy", "🇸🇬 新加坡节点");
    updateProxyOption(config, "name", /TW穿透SS-/, "dialer-proxy", "🐉 湾湾节点");

    // 修改订阅组选项
    updateGroupOption(config, "type", ["load-balance", "fallback", "url-test"], "lazy", true);
    updateGroupOption(config, "type", ["load-balance", "fallback", "url-test"], "max-failed-times", 7);
    updateGroupOption(config, "type", ["load-balance", "fallback", "url-test"], "timeout", 15000);

    // 修改节点skip-cert-verify选项
    updateProxyOption(config, "type", ["vmess", "vless", "trojan", "ss", "hysteria2", "tuic"], "skip-cert-verify", true);

    // // 修改节点 UDP over TCP 选项
    // updateProxyOption(config, "type", ["vmess", "vless", "trojan", "ss", "ssr", "tuic"], "udp-over-tcp", true);

    // 添加节点到正则组
    addProxiesToRegexGroup(config, /回家专用延迟优先/, "DIRECT", false, "top");
    addProxiesToRegexGroup(config, /回家专用故障转移/, "DIRECT", false, "top");
    addProxiesToRegexGroup(config, /CQGAS/, "DIRECT");
    addProxiesToRegexGroup(config, /流媒体手选/, "DIRECT");

    // 添加新节点
    const DIRECTv4Pre = { "name": "DIRECT-V4PRE", "type": "direct", "udp": true, "ip-version": "ipv4-prefer" };
    addProxyAndGroup(config, DIRECTv4Pre, "after", "DIRECT");

    // 添加规则
    addRules(config, "DOMAIN-SUFFIX,ai-assistant.upc.edu.cn,📚 学术直连", "unshift")
    addRules(config, "DOMAIN-SUFFIX,xsdk.upc.edu.cn,📚 学术直连", "unshift")
    addRules(config, "DOMAIN-SUFFIX,lan.upc.edu.cn,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN-SUFFIX,wlan.upc.edu.cn,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN-SUFFIX,v.upc.edu.cn,🚄 本地直连", "unshift")
    addRules(config, "IP-CIDR,121.251.251.0/24,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "DOMAIN-SUFFIX,webvpn.upc.edu.cn,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN-SUFFIX,sslvpn.upc.edu.cn,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN-SUFFIX,www.upc.edu.cn,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN,raw.githubusercontent.com,🚀 主要代理", "unshift")
    addRules(config, "DOMAIN,testingcf.jsdelivr.net,🚀 主要代理", "unshift")
    addRules(config, "DOMAIN,fastly.jsdelivr.net,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN,cdn.jsdmirror.com,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN-SUFFIX,akams.cn,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN,www.msftconnecttest.com,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN,dns.msftncsi.com,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN,www.msftncsi.com,🚄 本地直连", "unshift")

    //添加DNS规则
    addRules(config, "DOMAIN,dns.google,🚀 主要代理", "unshift")
    addRules(config, "IP-CIDR,8.8.8.8/32,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR,8.8.4.4/32,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2001:4860:4860::8888/128,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2001:4860:4860::8844/128,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "DOMAIN,dns.cloudflare.com,🚀 主要代理", "unshift")
    addRules(config, "DOMAIN,cloudflare-dns.com,🚀 主要代理", "unshift")
    addRules(config, "DOMAIN,one.one.one.one,🚀 主要代理", "unshift")
    addRules(config, "IP-CIDR,1.1.1.1/32,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR,1.1.1.2/32,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR,1.0.0.1/32,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR,101.101.101.101/32,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2606:4700:4700::1111/128,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2606:4700:4700::1001/128,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "DOMAIN-SUFFIX,opendns.com,🚀 主要代理", "unshift")
    addRules(config, "DOMAIN,dns.umbrella.com,🚀 主要代理", "unshift")
    addRules(config, "IP-CIDR,208.67.220.220/32,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR,208.67.222.222/32,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR,208.67.220.123/32,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR,208.67.222.123/32,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR,208.67.220.2/32,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR,208.67.222.2/32,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2620:119:35::35/128,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2620:119:53::53/128,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2620:119:35::123/128,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2620:119:53::123/128,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2620:0:ccc::2/128,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2620:0:ccd::2/128,🚀 主要代理,no-resolve", "unshift")
    addRules(config, "DOMAIN,dns.alidns.com,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN,doh.pub,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN,dot.pub,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN,doh-pure.onedns.net,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN,doh.360.cn,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN,dot.360.cn,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN-SUFFIX,dh-global-team.net,🚄 本地直连", "unshift")
    addRules(config, "DOMAIN-SUFFIX,dh-dns.global-idt.net,🚄 本地直连", "unshift")
    addRules(config, "IP-CIDR,162.14.132.109/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,36.112.139.253/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,125.88.223.158/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,110.185.101.40/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,119.29.29.29/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,223.5.5.5/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,223.6.6.6/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,180.76.76.76/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,114.114.114.114/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,114.114.115.115/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,114.114.114.119/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,114.114.115.119/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,114.114.114.110/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,114.114.115.110/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,123.125.81.6/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,1.12.12.12/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,120.53.53.53/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,1.12.12.12/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,120.53.53.53/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,117.50.10.10/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,52.80.52.52/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,1.2.4.8/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,210.2.4.8/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,101.226.4.6/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,218.30.118.6/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,123.125.81.6/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,140.207.198.6/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,180.184.1.1/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR,180.184.2.2/32,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2400:da00::6666/64,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,240c::6666/64,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2402:4e00::/64,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2402:4e00:1::/64,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2400:3200:baba::1/128,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2400:3200::1/128,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2404:c2c0:85d8:901::8/128,🚄 本地直连,no-resolve", "unshift")
    addRules(config, "IP-CIDR6,2400:7fc0:849e:200::8/128,🚄 本地直连,no-resolve", "unshift")
    
    // 分组排序
    // sortRulesWithinGroups(config)

    // 移除LS标记
    proxiesRename(config, "select", /\[LS\]/, "")

    return config;
}

// 增加/删除 DNS
// 传入参数：config, dnsMappings("["proxy-server-nameserver", "1.1.1.1"]"), del(boolean, 是否删除), createKey(boolean, 是否自动创建 dnsKey)
function updateDNS(config, dnsMappings, del = false, createKey = false) {
    if (config.dns) {
        dnsMappings.forEach(([dnsKey, dnsValue]) => {
            if (config.dns[dnsKey]) {
                if (del) {
                    // 删除操作
                    config.dns[dnsKey] = config.dns[dnsKey].filter(
                        (item) => item !== dnsValue
                    );
                } else {
                    // 添加操作
                    const hasDNS = config.dns[dnsKey].includes(dnsValue);
                    if (!hasDNS) {
                        config.dns[dnsKey].unshift(dnsValue);
                    }
                }
            } else if (createKey && !del) {
                config.dns[dnsKey] = [dnsValue];
            }
        });
    }
}

// 修改节点组内节点dialer-proxy代理并将relay节点组替换为新的节点组
// 传入参数：config, groupMappings([groupName, dialerProxyName, targetGroupName])
// 例如原逻辑为：自建落地（groupName）节点组为：自建节点1、自建节点2，relay节点组（targetGroupName）为：前置节点（dialerProxyName）、自建落地，通过脚本可以将自建节点1、自建节点2添加前置节点作为dialer-proxy代理，并修改relay节点组为select且只保留自建落地节点组
// 若groupName中为空或DIRECT，那么则targetGroupName添加dialerProxyName并设置为select
function updateDialerProxyGroup(config, groupMappings) {
    groupMappings.forEach(([groupName, dialerProxyName, targetGroupName]) => {
        const group = config["proxy-groups"].find(group => group.name === groupName);
        const targetGroupIndex = config["proxy-groups"].findIndex(group => group.name === targetGroupName);
        if (targetGroupIndex === -1) {
            return;
        }
        // 检查 group.proxies 是否为空或仅包含 "DIRECT"
        const hasOnlyDirect = group.proxies.length === 0 || group.proxies.every(proxyName => proxyName === "DIRECT");
        if (hasOnlyDirect) {
            config["proxy-groups"][targetGroupIndex] = {
                name: targetGroupName,
                type: "select",
                proxies: [dialerProxyName],
            };
        } else {
            group.proxies.forEach(proxyName => {
                if (proxyName !== "DIRECT") {
                    const proxy = config.proxies.find(p => p.name === proxyName);
                    if (proxy) {
                        proxy["dialer-proxy"] = dialerProxyName;
                    }
                }
            });
            config["proxy-groups"][targetGroupIndex] = {
                name: targetGroupName,
                type: "select",
                proxies: [groupName],
            };
        }
    });
}

// 修改节点组属性
// 传入参数：config, searchBy, targetGroups, optionName, optionValue
function updateGroupOption(config, searchBy, targetGroups, optionName, optionValue) {
    config["proxy-groups"].forEach(group => {
        if (Array.isArray(targetGroups)) {
            for (const targetGroup of targetGroups) {
                if (targetGroup instanceof RegExp && targetGroup.test(group[searchBy])) {
                    group[optionName] = optionValue;
                    break;
                } else if (group[searchBy] === targetGroup) {
                    group[optionName] = optionValue;
                    break;
                }
            }
        } else if (targetGroups instanceof RegExp && targetGroups.test(group[searchBy])) {
            group[optionName] = optionValue;
        } else if (group[searchBy] === targetGroups) {
            group[optionName] = optionValue;
        }
    });
}

// 修改节点属性
// 传入参数：config, searchBy, targetProxies, optionName, optionValue
function updateProxyOption(config, searchBy, targetProxies, optionName, optionValue) {
    config.proxies.forEach(proxy => {
        if (Array.isArray(targetProxies)) {
            for (const targetProxy of targetProxies) {
                if (targetProxy instanceof RegExp && targetProxy.test(proxy[searchBy])) {
                    proxy[optionName] = optionValue;
                    break;
                } else if (proxy[searchBy] === targetProxy) {
                    proxy[optionName] = optionValue;
                    break;
                }
            }
        } else if (targetProxies instanceof RegExp && targetProxies.test(proxy[searchBy])) {
            proxy[optionName] = optionValue;
        } else if (proxy[searchBy] === targetProxies) {
            proxy[optionName] = optionValue;
        }
    });
}


// 修改节点组内节点属性
// 传入参数：config, searchBy, targetGroups, optionName, optionValue
function updateProxyOptionByGroup(config, searchBy, targetGroups, optionName, optionValue) {
    config["proxy-groups"].forEach(group => {
        if (Array.isArray(targetGroups)) {
            for (const targetGroup of targetGroups) {
                if (targetGroup instanceof RegExp && targetGroup.test(group[searchBy])) {
                    group.proxies.forEach(proxyName => {
                        const proxy = (config.proxies || []).find(p => p.name === proxyName);
                        if (proxy) {
                            proxy[optionName] = optionValue;
                        }
                    });
                    break;
                } else if (group[searchBy] === targetGroup) {
                    group.proxies.forEach(proxyName => {
                        const proxy = (config.proxies || []).find(p => p.name === proxyName);
                        if (proxy) {
                            proxy[optionName] = optionValue;
                        }
                    });
                    break;
                }
            }
        } else if (targetGroups instanceof RegExp && targetGroups.test(group[searchBy])) {
            group.proxies.forEach(proxyName => {
                const proxy = (config.proxies || []).find(p => p.name === proxyName);
                if (proxy) {
                    proxy[optionName] = optionValue;
                }
            });
        } else if (group[searchBy] === targetGroups) {
            group.proxies.forEach(proxyName => {
                const proxy = (config.proxies || []).find(p => p.name === proxyName);
                if (proxy) {
                    proxy[optionName] = optionValue;
                }
            });
        }
    });
}


// 指定节点到正则匹配节点组
// 传入参数：config, regex, newProxies, del(boolean, 是否删除), position(添加节点时的位置,'top' 表示开头, 'bottom' 表示末尾。仅在 del 为 false 时生效)
function addProxiesToRegexGroup(config, regex, newProxies, del = false, position = 'end') {
    const targetGroups = config["proxy-groups"].filter(group => regex.test(group.name));

    if (!Array.isArray(newProxies)) {
        newProxies = [newProxies];
    }

    targetGroups.forEach(targetGroup => {
        newProxies.forEach(proxy => {
            if (del) {
                const index = targetGroup.proxies.indexOf(proxy);
                if (index > -1) {
                    targetGroup.proxies.splice(index, 1);
                }
            } else {
                if (!targetGroup.proxies.includes(proxy)) {
                    if (position === 'top') {
                        targetGroup.proxies.unshift(proxy);
                    } else {
                        targetGroup.proxies.push(proxy);
                    }
                }
            }
        });
    });
}

// 添加规则
// 传入参数：config, newrule, position(push/unshift，默认为unshift，即最高优先级)
function addRules(config, newrule, position) {
    if (position === "push") {
        config["rules"].splice(-1, 0, newrule);
    } else {
        config["rules"].unshift(newrule);
    }
}

// 删除规则
// 传入参数：config, ruleToDelete (要删除的规则，可以是字符串或正则表达式)
function delRules(config, ruleToDelete) {
    if (!config || !config.rules || !Array.isArray(config.rules)) {
      return;
    }
    const isRegExp = ruleToDelete instanceof RegExp;
    config.rules = config.rules.filter(rule => {
      if (isRegExp) {
        return !ruleToDelete.test(rule);
      } else {
        return rule !== ruleToDelete;
      }
    });
  }

// 删除指定属性节点
// 传入参数：config, property(属性), value(值)
function removeProxiesByProperty(config, property, value) {
    const removedProxyNames = [];
    config.proxies = config.proxies.filter(proxy => {
        if (proxy[property] === value) {
            removedProxyNames.push(proxy.name);
            return false;
        }
        return true;
    });
    config["proxy-groups"].forEach(group => {
        group.proxies = group.proxies.filter(proxyName => !removedProxyNames.includes(proxyName));
    });
}

// 对规则进行排序
// 传入参数：config
function sortRulesWithinGroups(config) {
    const ruleTypeOrder = {
        'PROCESS': 0,
        'DOMAIN': 1,
        'IP': 2
    };

    function getRuleTypeCategory(rule) {
        const ruleType = rule.split(',')[0];
        if (ruleType.startsWith('PROCESS')) return 'PROCESS';
        if (ruleType.startsWith('DOMAIN') || ruleType === 'GEOSITE') return 'DOMAIN';
        if (ruleType.startsWith('IP') || ruleType === 'GEOIP') return 'IP';
        return 'OTHER';
    }

    function compareRules(a, b) {
        const categoryA = getRuleTypeCategory(a);
        const categoryB = getRuleTypeCategory(b);
        const orderA = ruleTypeOrder[categoryA] !== undefined ? ruleTypeOrder[categoryA] : 3;
        const orderB = ruleTypeOrder[categoryB] !== undefined ? ruleTypeOrder[categoryB] : 3;
        return orderA - orderB;
    }

    function getRuleGroup(rule) {
        const parts = rule.split(',');
        const lastPart = parts[parts.length - 1];
        const secondLastPart = parts[parts.length - 2];

        if (lastPart === 'no-resolve' || lastPart === 'DIRECT') {
            return secondLastPart;
        }
        return lastPart;
    }

    let sortedRules = [];
    let currentGroup = [];
    let currentGroupTarget = null;

    for (let i = 0; i < config.rules.length; i++) {
        const rule = config.rules[i];
        const ruleTarget = getRuleGroup(rule);

        if (ruleTarget === currentGroupTarget) {
            currentGroup.push(rule);
        } else {
            if (currentGroup.length > 0) {
                currentGroup.sort(compareRules);
                sortedRules = sortedRules.concat(currentGroup);
            }
            currentGroup = [rule];
            currentGroupTarget = ruleTarget;
        }
    }

    if (currentGroup.length > 0) {
        currentGroup.sort(compareRules);
        sortedRules = sortedRules.concat(currentGroup);
    }

    config.rules = sortedRules;
    return config;
}


// 向 proxies 添加节点并配置属性，然后添加到指定的节点组
// 传入参数：config, newProxy, insertMode(before插入特定节点之前/after插入特定节点之后/regex插入正则组), reference
function addProxyAndGroup(config, newProxy, insertMode, reference) {
    // 1. 添加节点到 config.proxies
    if (!config.proxies) {
        config.proxies = [];
    }
    if (!config["proxy-groups"]) {
        config["proxy-groups"] = [];
    }
    config.proxies.push(newProxy);

    // 2. 将节点添加到指定的节点组
    if (insertMode === "before" || insertMode === "after") {
        let targetGroups = [];
        for (let i = 0; i < config["proxy-groups"].length; i++) {
            const group = config["proxy-groups"][i];
            if (group.proxies.includes(reference)) {
                targetGroups.push(group);
            }
        }

        targetGroups.forEach(targetGroup => {
            const referenceIndex = targetGroup.proxies.indexOf(reference);
            if (insertMode === "before") {
                targetGroup.proxies.splice(referenceIndex, 0, newProxy.name);
            } else {
                targetGroup.proxies.splice(referenceIndex + 1, 0, newProxy.name);
            }
        });

        if (targetGroups.length === 0) {
            console.error(`Reference proxy "${reference}" not found in any group.`);
        }
    } else if (insertMode === "regex") {
        if (!(reference instanceof RegExp)) {
            console.error("Reference must be a regular expression for 'regex' mode.");
            return;
        }

        const targetGroups = config["proxy-groups"].filter(group => reference.test(group.name));
        targetGroups.forEach(targetGroup => {
            if (!targetGroup.proxies.includes(newProxy.name)) {
                targetGroup.proxies.push(newProxy.name);
            }
        });
    } else {
        console.error("Invalid insertMode. Use 'before', 'after', or 'regex'.");
    }
}
// addProxyAndGroup使用方法
// // 假设的配置对象
// let config = {
//     "proxies": [
//         { "name": "节点A", "type": "ss", "server": "serverA", "port": 443, "cipher": "aes-256-gcm", "password": "passwordA" },
//         { "name": "节点B", "type": "vmess", "server": "serverB", "port": 443, "uuid": "uuidB", "alterId": 64, "cipher": "auto" }
//     ],
//     "proxy-groups": [
//         { "name": "Group1", "type": "select", "proxies": ["节点A", "节点B"] },
//         { "name": "Group2", "type": "url-test", "proxies": ["节点B"] },
//         { "name": "香港", "type": "url-test", "proxies": ["节点A"] }
//     ],
//     "rules": []
// };

// // 示例1：添加一个新节点，并将其放置在包含 "节点A" 的组的前面
// const newProxy1 = { "name": "新节点1", "type": "trojan", "server": "server1", "port": 443, "password": "password1" };
// addProxyAndGroup(config, newProxy1, "before", "节点A");

// // 示例2：添加一个新节点，并将其放置在包含 "节点B" 的组的后面
// const newProxy2 = { "name": "新节点2", "type": "ss", "server": "server2", "port": 443, "cipher": "chacha20-ietf-poly1305", "password": "password2" };
// addProxyAndGroup(config, newProxy2, "after", "节点B");

// // 示例3：添加一个新节点，并将其放置在名称匹配 /香港/ 的组中
// const newProxy3 = { "name": "新节点3", "type": "vmess", "server": "server3", "port": 443, "uuid": "uuid3", "alterId": 32, "cipher": "auto" };
// addProxyAndGroup(config, newProxy3, "regex", /香港/);

// console.log(JSON.stringify(config, null, 2));

// 正则批量删除节点组
// 传入参数：config, regex
function removeGroupsByRegex(config, regex) {
    const removedGroupNames = [];
    config["proxy-groups"] = config["proxy-groups"].filter(group => {
        if (regex.test(group.name)) {
            removedGroupNames.push(group.name);
            return false;
        }
        return true;
    });
    config["proxy-groups"].forEach(group => {
        group.proxies = group.proxies.filter(proxyName => !removedGroupNames.includes(proxyName));
    });
}

// 正则批量删除节点
// 传入参数：config, regex
function removeProxiesByRegex(config, regex) {
    const removedProxyNames = [];

    config.proxies = config.proxies.filter(proxy => {
        if (regex.test(proxy.name)) {
            removedProxyNames.push(proxy.name);
            return false;
        }
        return true;
    });

    config["proxy-groups"].forEach(group => {
        group.proxies = group.proxies.filter(proxyName => !removedProxyNames.includes(proxyName));
        if (group.proxies.length === 0) {
            group.proxies.push("DIRECT");
        }
    });
}

/**
 * 重命名代理节点。
 *
 * @param {object} config - 代理配置对象。
 * @param {string} type - 重命名类型，可选值为 'all' 或 'select'。
 *                       - 'all': 将匹配正则表达式的节点名称完全替换为 newname。
 *                       - 'select': 仅将节点名称中匹配正则表达式的部分替换为 newname。
 * @param {RegExp} regex - 用于匹配节点名称的正则表达式。
 * @param {string} newname - 新的节点名称字符串。
 * @returns {object} - 修改后的代理配置对象。
 */
function proxiesRename(config, type, regex, newname) {
    config.proxies.forEach(proxy => {
        if (regex.test(proxy.name)) {
            const oldName = proxy.name;
            if (type === 'all') {
                proxy.name = newname;
            } else if (type === 'select') {
                proxy.name = proxy.name.replace(regex, newname);
            }

            config["proxy-groups"].forEach(group => {
                const index = group.proxies.indexOf(oldName);
                if (index > -1) {
                    group.proxies[index] = proxy.name;
                }
            });
        }
    });
    return config;
}

/**
 * 根据层级路径、查找条件和修改键值对修改配置对象中的属性。
 *
 * @param {object} config - 要修改的配置对象。
 * @param {string} path - 要修改的属性的层级路径，例如 "proxy-groups.name" 或 "tun.enable"。空字符串 "" 表示修改全局配置。
 * @param {string} [searchKey] - 用于查找的属性名（可选）。如果为空，则表示修改全局配置。
 * @param {*} [searchValue] - 用于查找的属性值（可选）。
 * @param {string} modifyKey - 要修改的属性名。
 * @param {*} modifyValue - 要设置的属性值。
 * @returns {object} - 修改后的配置对象。
 *
 * @example
 * // 假设的配置对象
 * let config = {
 *     "proxy-groups": [
 *         { "name": "Group1", "type": "select" },
 *         { "name": "Group2", "type": "url-test" }
 *     ],
 *     "tun": {
 *         "enable": false
 *     },
 *     "port": 7890
 * };
 *
 * // 1. 根据 name 修改节点组属性 proxy-groups.name 查找 type 进行修改
 * config = modifyConfigByPath(config, "proxy-groups", "name", "Group1", "type", "fallback");
 *
 * // 2. 根据类型修改节点组 proxies proxy-groups.type 查找 proxies 进行修改
 * config = modifyConfigByPath(config, "proxy-groups", "type", "url-test", "proxies", ["节点C"]);
 *
 * // 3. 可以修改全局配置比如查找 port 进行修改
 * config = modifyConfigByPath(config, "", null, null, "port", 7891);
 *
 * // 4. 或者 tun 查找 enable 进行修改
 * config = modifyConfigByPath(config, "tun", "enable", false, "enable", true);
 *
 * // 5. 如果不存在的属性则进行创建 (在 proxy-groups 中为 Group1 添加新属性 custom)
 * config = modifyConfigByPath(config, "proxy-groups", "name", "Group1", "custom", "value");
 *
 * // 6. 如果不存在的全局属性则进行创建
 * config = modifyConfigByPath(config, "", null, null, "newGlobalOption", "new value");
 */
function modifyConfigByPath(config, path, searchKey, searchValue, modifyKey, modifyValue) {
    if (path === "") {
        config[modifyKey] = modifyValue;
        return config;
    }

    const pathSegments = path.split('.');
    let current = config;
    let parent = null;
    let currentKey = null;

    for (const segment of pathSegments) {
        parent = current;
        currentKey = segment;
        if (current && current.hasOwnProperty(segment)) {
            current = current[segment];
        } else {
            // 如果路径不存在，则创建
            if (parent) {
                parent[segment] = {};
                current = parent[segment];
            } else {
                console.error(`路径 ${path} 不存在且无法创建。`);
                return config;
            }
        }
    }

    if (Array.isArray(current)) {
        // 处理数组类型的目标，例如 proxy-groups
        current.forEach(item => {
            if (item && item.hasOwnProperty(searchKey) && item[searchKey] === searchValue) {
                if (modifyKey) {
                    item[modifyKey] = modifyValue;
                } else {
                    // 如果没有 modifyKey，则直接修改当前项
                    console.warn("未指定 modifyKey，无法修改数组元素。");
                }
            }
        });
    } else if (typeof current === 'object' && current !== null) {
        if (searchKey && current.hasOwnProperty(searchKey)) {
            if (current[searchKey] === searchValue) {
                current[modifyKey] = modifyValue;
            }
        } else if (!searchKey && modifyKey) {
            // 修改全局配置
            current[modifyKey] = modifyValue;
        } else if (!searchKey && !modifyKey) {
            console.warn("未指定 searchKey 或 modifyKey，无法修改对象。");
        }
    } else if (parent && currentKey && modifyKey) {
        // 处理需要创建属性的情况
        parent[currentKey] = parent[currentKey] || {};
        parent[currentKey][modifyKey] = modifyValue;
    } else {
        console.warn(`无法修改路径 ${path}，请检查路径和参数。`);
    }

    return config;
}

/**
 * 在匹配的代理组内对代理节点进行排序。
 *
 * @param {object} config - 代理配置对象。
 * @param {RegExp} groupRegex - 用于匹配目标代理组名称的正则表达式。
 * @param {RegExp[]} proxiesOrderRegex - 一个正则表达式数组，定义了节点的排序优先级。
 * @example
 * // 将名称包含 "故障转移" 的组中的节点排序，香港节点在前，美国节点其次。
 * sortProxiesInGroup(config, /故障转移/, [/香港/, /美国/]);
 */
function sortProxiesInGroup(config, groupRegex, proxiesOrderRegex) {
    // 查找匹配的代理组
    const targetGroups = config["proxy-groups"].filter(group => groupRegex.test(group.name));
    targetGroups.forEach(group => {
        const originalProxies = group.proxies;
        let sortedProxies = [];
        const remainingProxies = new Set(originalProxies);
        proxiesOrderRegex.forEach(orderRegex => {
            const matched = [];
            originalProxies.forEach(proxyName => {
                if (orderRegex.test(proxyName) && remainingProxies.has(proxyName)) {
                    matched.push(proxyName);
                    remainingProxies.delete(proxyName);
                }
            });
            sortedProxies = sortedProxies.concat(matched);
        });
        const unmatchedProxies = originalProxies.filter(proxyName => remainingProxies.has(proxyName));
        sortedProxies = sortedProxies.concat(unmatchedProxies);
        group.proxies = sortedProxies;
    });

    return config;
}

// 移除所有为Null的对象
function removeNullValues(config) {
    for (const key in config) {
        if (config[key] === null) {
            delete config[key];
        } else if (typeof config[key] === 'object') {
            removeNullValues(config[key]);
        }
    }
}
