'use strict';

const Compute = require('@google-cloud/compute');
const got = require('got');

const FIREWALL_RULE_NAME = 'allow-ssh-from-home';

const getMyIP = async () => {
    const response = await got('https://api.ipify.org');
    return response.body;
}

const getGCloudFirewallRule = async (ruleName) => {
    const compute = new Compute();
    const network = compute.network('default');
    const firewallRules = await compute.firewall(ruleName).get();
    if(firewallRules.length == 0) {
        throw new Error('No such firewall rule found!');
    }

    return firewallRules[0];
}

const updateGCloudFirewallRule = async (firewall, metadata) => {
    await firewall.setMetadata(metadata);
}

const fnJustDoIt = async () => {

    // 1. Get my current IP
    const myCurrentIP = await getMyIP();

    // 2. Get firewall rule from Google Cloud
    const gcloudFirewallRule = await getGCloudFirewallRule(FIREWALL_RULE_NAME);

    // 3. Check if my ip is allowed in the rule
    let yoIndex = gcloudFirewallRule.metadata.sourceRanges.indexOf(myCurrentIP);
    if(yoIndex > -1) {
        console.log('Already whitelisted. Exiting');
    } else {
        console.log('Not whitelisted, will update rule');
        const newMetadata = {
            sourceRanges: [myCurrentIP]
        };
        await updateGCloudFirewallRule(gcloudFirewallRule, newMetadata);
        console.log('Update done!');
    }
}

fnJustDoIt();
