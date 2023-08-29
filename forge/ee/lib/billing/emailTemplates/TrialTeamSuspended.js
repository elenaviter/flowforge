// Sent when a trial ends without billing setup

// Inserts:
// - username
// - teamSettingsURL

module.exports = {
    subject: 'Your FlowFuse trial has ended',
    text:
`Hello {{{username}}},

Your FlowFuse trial has now ended. We hope you've enjoyed your time with us.

As we do not have any billing information for your team, we have suspended
your instances.

If you want to restart them you can setup billing on your Team Settings page:

{{{teamSettingsURL}}}

Cheers!

Your friendly FlowFuse Team
`,
    html:
`<p>Hello {{{username}}},</p>

<p>Your FlowFuse trial has now ended. We hope you've enjoyed your time with us.</p>

<p>As we do not have any billing information for your team, we have suspended
your instances.</p>

<p>If you want to restart them you can setup billing on your <a href="{{{teamSettingsURL}}}">Team Settings page</a>.

<p>Cheers!</p>

<p>Your friendly FlowFuse Team</p>

`
}
