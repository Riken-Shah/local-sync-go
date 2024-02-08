const columns = [
    {name: "ID", uid: "user_id", sortable: true},
    {name: "NAME", uid: "displayName", sortable: true},
    {name: "EMAIL", uid: "email"},
    {name: "ACTIONS", uid: "actions"},
];

const rolesOption = [
    {label: "Owner", value: 0},
    {label: "Admin", value: 1},
    {label: "Designer", value: 3},
    {label: "Remove", value: 4},
]

const statusOptions = [
    {name: "Active", uid: "active"},
    {name: "Paused", uid: "paused"},
    {name: "Vacation", uid: "vacation"},
];


export {columns, statusOptions, rolesOption};
