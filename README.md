[![Docker Repository on Quay.io](https://quay.io/repository/nickjj/faye/status "Docker Repository on Quay.io")](https://quay.io/repository/nickjj/faye)

### What is docker-faye?

Run a node.js Faye server to handle real time push notifications. At the moment
it's only suitable for pushing data from a trusted source to Faye.

There is no client authentication or CSRF in place, but this is a non-issue if
you're sending data from a trusted source to Faye.

### Configuration through ENV variables

The defaults are provided below.

```
# Do you want handshakes and disconnects to be logged to STDOUT?
FAYE_LOGGING=0

# How will we connect to Redis?
FAYE_REDIS_HOST='redis'
FAYE_REDIS_PORT=6397

# Faye adapter configuration.
FAYE_PORT=4242
FAYE_MOUNT='/stream'
FAYE_TIMEOUT=45

# If supplied, Faye will only allow push requests from this domain.
FAYE_SAME_ORIGIN_URL=''

# This should be a strong token that is never shared with anyone other than
# the server pushing data to Faye.
FAYE_PUSH_TOKEN=''
```

### Are you using docker-compose?

If so, adjust your `docker-compose.yml` to look something like this:

```yaml

# This Faye image assumes you're using Redis because let's be serious now, you
# should not be using anything but Redis as a backend with Faye!
redis:
  image: redis:2.8.21
  ports:
    - 6379:6379

# I left in a dummy FAYE_PUSH_TOKEN to give you an idea of how secure the token
# should be. DO NOT USE THIS TOKEN, GENERATE YOUR OWN!
faye:
  image: quay.io/nickjj/faye
  links:
    - redis
  ports:
    - 4242:4242
  environment:
    FAYE_PUSH_TOKEN: 25087a8154b2b4b859362a2442bcf8a8bc0fc53b70fb3dfe57e67928d9aad8608cecabea58999bdd4fa5094b4c9032b7255d7ceb7aee6c29fbbdab43a33bf8f0
  ```

### Trying to troubleshoot your server?

Try running the curl command below, you should get a success response if it works.

Keep in mind if you changed the host location, mount endpoint or push token then
you will need to adjust the curl command below.

```
curl -X POST http://localhost:4242/stream \
    -H 'Content-Type: application/json' \
    -d '{"channel": "/foo", "data": "Hello", "ext": {"pushToken": "25087a8154b2b4b859362a2442bcf8a8bc0fc53b70fb3dfe57e67928d9aad8608cecabea58999bdd4fa5094b4c9032b7255d7ceb7aee6c29fbbdab43a33bf8f0"}}'
```
