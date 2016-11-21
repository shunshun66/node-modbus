var stampit     = require('stampit')

module.exports = stampit()
    .init(function () {
    
        var init = function () {
       
            this.log.debug('initiating read coils request handler.');

            if (!this.responseDelay) {
                this.responseDelay = 0;
            }

            this.setRequestHandler(1, onRequest);
        
        }.bind(this);
    
        var onRequest = function (pdu, cb) {

            setTimeout(function () {

                this.log.debug('handling read coils request.');


                if (pdu.length !== 5) {
                
                  var buf = Buffer.allocUnsafe(2)

                  buf.writeUInt8(0x81, 0)
                  buf.writeUInt8(0x02, 1)
                  cb(buf)
                  return
                }

                var //fc          = pdu.readUInt8(0),
                    start       = pdu.readUInt16BE(1),
                    quantity    = pdu.readUInt16BE(3);

                this.emit('readCoilsRequest', start, quantity);

                var mem = this.getCoils();

                if (start > mem.length * 8 || start + quantity > mem.length * 8) {
                
                  var buf = Buffer.allocUnsafe(2)
                  buf.writeUInt8(0x81, 0)
                  buf.writeUInt8(0x02, 1)
                  cb(buf)
                  return
                }

                var val = 0, 
                    thisByteBitCount = 0,
                    byteIdx = 2,
                    byteCount = Math.ceil(quantity / 8),
                    response = Buffer.allocUnsafe(2 + byteCount)

                response.writeUInt8(0x01, 0)
                response.writeUInt8(byteCount, 1);

                for (var totalBitCount = start; totalBitCount < start + quantity; totalBitCount += 1) {
     
                    var buf = mem.readUInt8(Math.floor(totalBitCount / 8));
                    var mask = 1 << (totalBitCount % 8);

                    if(buf & mask) {
                      val += 1 << (thisByteBitCount % 8)
                    }
               
                    thisByteBitCount += 1;

                    if (thisByteBitCount % 8 === 0 || totalBitCount === (start + quantity) - 1) {
                   
                        response.writeUInt8(val, byteIdx)
                        val = 0; byteIdx = byteIdx + 1
                    }
                }

                cb(response);

            }.bind(this), this.responseDelay);
            
        }.bind(this);
    

        init();
    
    });
