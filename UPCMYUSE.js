function main(config, profileName) {

    updateDNS(config, [
        ["proxy-server-nameserver", "121.251.251.251"],
        ["default-nameserver", "121.251.251.251"],
        ["direct-nameserver", "121.251.251.251"],
        ["nameserver", "121.251.251.251"]
    ]);

    updateDNS(config, [
        ["proxy-server-nameserver", "system"],
        ["default-nameserver", "system"],
        ["direct-nameserver", "system"],
        ["nameserver", "system"]
    ], true);

    // 修改落地节点 IP 版本
    updateProxyOptionByGroup(config, "name", /.*/, "ip-version", "ipv4-prefer");

    // 关闭自建落地TCP快速打开
    updateProxyOption(config, "name", /自建L/, "tfo", false)

    // 设置dialer-proxy
    // updateDialerProxyGroup(config, [
    //     ["🛬 新加坡落地", "🇸🇬 新加坡节点", "🦁 新加坡自建落地"],
    //     ["🛬 美国落地", "🇺🇲 美国节点", "💵 美国自建落地"],
    //     ["🛬 日本落地", "🇯🇵 日本节点", "🎎 日本自建落地"],
    //     ["🛬 香港落地", "🇭🇰 香港节点", "🌷 香港自建落地"],
    //     ["🛬 西北欧落地", "🇪🇺 西北欧节点", "🗼 西北欧自建落地"],
    //     ["🛬 任选落地", "🛫 任选前置", "🚡 任选落地"]
    // ]);

    // 修改节点dialer-proxy (正则匹配)
    updateProxyOption(config, "name", /JP穿透SS-/, "dialer-proxy", "🇯🇵 日本节点");
    updateProxyOption(config, "name", /HK穿透SS-/, "dialer-proxy", "🇭🇰 香港节点");
    updateProxyOption(config, "name", /US穿透SS-/, "dialer-proxy", "🇺🇲 美国节点");
    updateProxyOption(config, "name", /SG穿透SS-/, "dialer-proxy", "🇸🇬 新加坡节点");

    // 修改订阅组选项
    updateGroupOption(config, "type", ["load-balance", "fallback", "url-test"], "lazy", true);
    // updateGroupOption(config, "type", ["load-balance"], "strategy", "round-robin");

    // 修改节点 UDP over TCP 选项
    updateProxyOption(config, "type", ["vmess", "vless", "trojan", "ss", "ssr", "tuic"], "udp-over-tcp", true);

    // 添加节点到正则组
    addProxiesToRegexGroup(config, /回家专用延迟优先/, "DIRECT");
    addProxiesToRegexGroup(config, /CQGAS/, "DIRECT");
    addProxiesToRegexGroup(config, /流媒体手选/, "DIRECT");
    addProxiesToRegexGroup(config, /西北欧自建落地/, "🇪🇺 西北欧节点",true);
    addProxiesToRegexGroup(config, /西北欧自建落地/, "🛬 西北欧落地",true);
    addProxiesToRegexGroup(config, /西北欧自建落地/, "🇭🇰 香港节点");
    addProxiesToRegexGroup(config, /西北欧自建落地/, "🛬 香港落地");
    addProxiesToRegexGroup(config, /西北欧自建落地/, "🛬 西北欧落地");

    // 添加新节点
    const DIRECTv4Pre = { "name": "DIRECT-V4PRE", "type": "direct", "udp": true, "ip-version": "ipv4-prefer" };
    addProxyAndGroup(config, DIRECTv4Pre, "before", "DIRECT");

    // 添加规则
    // addRules(config, "AND,((NETWORK,UDP),(DST-PORT,443),(GEOSITE,youtube)),REJECT", "unshift");

    // 分组排序
    sortRulesWithinGroups(config)

    return config;
}

// 增加/删除 DNS
// 传入参数：config, dnsMappings("["proxy-server-nameserver", "121.251.251.251"]"), del(boolean, 是否删除)
function updateDNS(config, dnsMappings, del = false) {
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
            }
        });
    }
}

// 修改节点组内节点dialer-proxy代理并将relay节点组替换为新的节点组
// 传入参数：config, groupMappings([groupName, dialerProxyName, targetGroupName])
// 例如原逻辑为：自建落地（groupName）节点组为：自建节点1、自建节点2，relay节点组（targetGroupName）为：前置节点（dialerProxyName）、自建落地，通过脚本可以将自建节点1、自建节点2添加前置节点作为dialer-proxy代理，并修改relay节点组为select且只保留自建落地节点组
function updateDialerProxyGroup(config, groupMappings) {
    groupMappings.forEach(([groupName, dialerProxyName, targetGroupName]) => {
        const group = config["proxy-groups"].find(group => group.name === groupName);
        if (group) {
            group.proxies.forEach(proxyName => {
                if (proxyName !== "DIRECT") {
                    const proxy = (config.proxies || []).find(p => p.name === proxyName);
                    if (proxy) {
                        proxy["dialer-proxy"] = dialerProxyName;
                    }
                }
            });

            if (group.proxies.length > 0) {
                const targetGroupIndex = config["proxy-groups"].findIndex(group => group.name === targetGroupName);
                if (targetGroupIndex !== -1) {
                    config["proxy-groups"][targetGroupIndex] = {
                        name: targetGroupName,
                        type: "select",
                        proxies: [groupName],
                    };
                }
            }
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
// 传入参数：config, regex, newProxies, del(boolean, 是否删除)
function addProxiesToRegexGroup(config, regex, newProxies, del = false) {
    const targetGroups = config["proxy-groups"].filter(group => regex.test(group.name));
    targetGroups.forEach(targetGroup => {
        if (!Array.isArray(newProxies)) {
            newProxies = [newProxies];
        }
        newProxies.forEach(proxy => {
            if (del) {
                const index = targetGroup.proxies.indexOf(proxy);
                if (index > -1) {
                    targetGroup.proxies.splice(index, 1);
                }
            } else {
                if (!targetGroup.proxies.includes(proxy)) {
                    targetGroup.proxies.push(proxy);
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
// 传入参数：config, newProxy, insertMode, reference
function addProxyAndGroup(config, newProxy, insertMode, reference) {
    // 1. 添加节点到 config.proxies
    if (!config.proxies) {
        config.proxies = [];
    }
    config.proxies.push(newProxy);

    // 2. 将节点添加到指定的节点组
    if (insertMode === "before" || insertMode === "after") {
        // 方式 1: 放置到包含某个节点的组的上面或者下面
        let targetGroup = null;
        let targetIndex = -1;

        // 查找包含 reference 的节点组
        for (let i = 0; i < config["proxy-groups"].length; i++) {
            const group = config["proxy-groups"][i];
            const index = group.proxies.indexOf(reference);
            if (index > -1) {
                targetGroup = group;
                targetIndex = i;
                break;
            }
        }

        // 将节点添加到目标组
        if (targetGroup) {
            const referenceIndex = targetGroup.proxies.indexOf(reference);
            if (insertMode === "before") {
                targetGroup.proxies.splice(referenceIndex, 0, newProxy.name);
            } else {
                targetGroup.proxies.splice(referenceIndex + 1, 0, newProxy.name);
            }
        } else {
            console.error(`Reference proxy "${reference}" not found in any group.`);
        }
    } else if (insertMode === "regex") {
        // 方式 2: 放置到正则表达式允许的组
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
// 向 proxies 添加节点并配置属性，然后添加到指定的节点组
// 传入参数：config, newProxy, insertMode(before插入特定节点之前/after插入特定节点之后/regex插入正则组), reference
function addProxyAndGroup(config, newProxy, insertMode, reference) {
    // 1. 添加节点到 config.proxies
    if (!config.proxies) {
        config.proxies = [];
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