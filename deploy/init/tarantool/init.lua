box.cfg{}
if not box.schema.user.exists('queue') then
    box.schema.user.create('queue', {password = 'queue-pass'})
end
box.schema.user.grant('queue', 'read,write,execute', 'universe')
box.schema.user.grant('guest', 'read,write,execute', 'universe')

local ok, queue = pcall(require, 'queue')
if not ok then
    error('queue module is required')
end

if not queue.tube.events_queue then
    queue.create_tube('events_queue', 'fifo', {
        if_not_exists = true,
        temporary = false,
        opts = {ttl = 3600, max_len = 5000}
    })
end
