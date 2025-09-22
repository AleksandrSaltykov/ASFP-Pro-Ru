box.cfg{}

if not box.schema.user.exists("queue") then
    box.schema.user.create("queue", {password = "queue-pass"})
end

local function safe_grant(user, perms)
    local ok, err = pcall(box.schema.user.grant, user, perms, "universe")
    if not ok then
        local msg = tostring(err)
        if not string.find(msg, "already has") then
            error(err)
        end
    end
end

safe_grant("queue", "read,write,execute")
safe_grant("guest", "read,write,execute")

local ok, queue = pcall(require, "queue")
if not ok then
    error("queue module is required")
end

if not queue.tube.events_queue then
    queue.create_tube("events_queue", "fifo", {
        if_not_exists = true,
        temporary = false,
        opts = {ttl = 3600, max_len = 5000}
    })
end
