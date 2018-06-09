//index.js  
//获取应用实例  
var app = getApp()
var config = require('../lib/config.js')

Page({
  data: {
    /** 
     * 页面配置 
     */
    wxapath:'',
    wxawidth: '',
    qrpath: '',
    qrwidth: '',
    winWidth: 0,
    winHeight: 0,
    /**
     * 图片加载
     */
    imgheights: [],
    imgwidth: 750,
    current: 0,
    // tab切换  
    currentTab: 0,
    url: '',
    urls: []
  },
  onLoad: function () {
    var that = this;

    /** 
     * 获取系统信息 
     */
    wx.getSystemInfo({

      success: function (res) {
        that.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight/2
        });
      }

    });
  },
  /** 
     * 滑动切换tab 
     */
  bindChange: function (e) {
    var that = this;
    that.setData({ currentTab: e.detail.current });
  },
  /** 
   * 点击tab切换 
   */
  swichNav: function (e) {

    var that = this;

    if (this.data.currentTab === e.target.dataset.current) {
      return false;
    } else {
      that.setData({
        currentTab: e.target.dataset.current
      })
    }
  },
  imageLoad: function (e) {
    //获取图片真实宽度  
    var imgwidth = e.detail.width,
      imgheight = e.detail.height,
      //宽高比  
      ratio = imgwidth / imgheight;

    //计算的高度值  
    var viewHeight = 750 / ratio;
    var imgheight = viewHeight
    var imgheights = this.data.imgheights
    //把每一张图片的高度记录到数组里  
    imgheights.push(imgheight)
    this.setData({
      imgheights: imgheights,
      current: imgheights.length - 1
    })
  },
  /**
   * wecodePath校验
   */
  wxapathInput: function (e) {
    var path = e.detail.value
    if (path.indexOf("?") == -1) {
      path.replace("?", "&")
    }
    this.setData({
      wxapath: path
    })
  },
  /**
   * wecodewidth校验
   */
  wxawidthInput: function (e) {
    var width = e.detail.value
    if ((!/^[1-9]\d*$/.test(width))) {
      width = ""
    }
    this.setData({
      wxawidth: width
    })
  },
  /**
   * qrcodePath校验
   */
  qrpathInput: function (e) {
    var path = e.detail.value
    if (path.indexOf("?") == -1) {
      path.replace("?","&")
    }
    this.setData({
      qrpath: path
    })
  },
  /**
   * qrcodewidth校验
   */
  qrwidthInput: function (e) {
    var width = e.detail.value
    if ((!/^[1-9]\d*$/.test(width))) {
      width = ""
    }
    this.setData({
      qrwidth: width
    })
  },
  /**
   * 生成小程序码
   */
  generateWeappCode: function() {
    var that = this
    
    if(this.data.wxapath.length<20){
      that.showTankuang('请输入正确的path')
      return
    }
    if (this.data.wxapath.indexOf("?") != -1) {
      that.setData({
        wxapath: this.data.wxapath.replace("?", "&")
      })
    }
    if (this.data.wxawidth == '') {
     that.setData({
       wxawidth: 430
     })
    }
    console.log(this.data.wxapath)
    that.getAccess_token('wxa')
  },
  /**
   * 生成普通码
   */
  generateNormalCode: function () {
    var that = this

    that.getAccess_token('pt')
  },
  /**
   * 生成二维码
   */
  generateQrCode: function() {
    var that = this
    if (this.data.qrpath.length < 20) {
      that.showTankuang('请输入正确的1path')
      return
    }
    if (this.data.qrwidth == '') {
      that.setData({
        qrwidth: 430
      })
    }
    that.getAccess_token('qr')
  },
  confirm: function(options) {
    var that = this
    var e = options.currentTarget.dataset.type
    if (e == 'pt') {
      that.generateNormalCode(e)
      return
    }
    wx.showModal({
      title: '提示',
      content: '确定要生成此path的二维码吗',
      showCancel: true,
      success: function (res) {
        
        if (res.confirm) {
          if(e == 'wxa'){
            that.generateWeappCode(e)
          }
          if (e == 'qr'){
            that.generateQrCode(e)
          }
          
        }
      }
    })
  },
  /**
   * 获取access_token
   */
  getAccess_token: function(e) {
    var that = this
    wx.request({
      
      url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + config.appid + '&secret=' + config.secret,
      data: {},
      method: 'GET', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      dataType: "json",
      success: function (data) {
        if (data) {
          console.log(data)
          if (data.data.access_token != undefined) {
            that.setData({
              access_token: data.data.access_token
            })
            that.getCode(e)
          }
        }
      }
    })
  },
  /**
   * 获取code图片
   */
  getCode: function(e) {
    var that = this
    var access_token = that.data.access_token
    if(e == 'qr') {
      wx.request({
        url: 'https://api.weixin.qq.com/cgi-bin/wxaapp/createwxaqrcode?access_token=' + access_token,
        data: { 
          path: "pages/webs/webs?backurl=" + that.data.qrpath, 
          width: that.data.qrwidth
        },
        method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
        responseType: 'arraybuffer',
        success: function (data) {
          if (data) {
            console.log(data)
            if (data.data != undefined) {
              let blob = new Blob([data.data], { type: 'image/jpeg' })
              that.getCanvasImage(URL.createObjectURL(blob))
              that.setData({
                url: URL.createObjectURL(blob),
                urls: [URL.createObjectURL(blob)]
              })
            }
          }
        }
      })
    }
    if(e == 'wxa') {
      
      wx.request({
        url: 'https://api.weixin.qq.com/wxa/getwxacode?access_token=' + access_token,
        data: {
          path: "pages/webs/webs?backurl=" + that.data.wxapath,
          width: that.data.wxawidth
        },
        header: {
          'content-type': 'text/plain;charset=UTF-8', // 默认值
          'Accept': '*/*'
        },
        method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
        responseType: 'arraybuffer',
        success: function (data) {
          if (data) {
            console.log(data)
            if (data.data != undefined) {
              let blob = new Blob([data.data], { type: 'image/jpeg' })
              
              that.getCanvasImage(URL.createObjectURL(blob))
              that.setData({
                url: URL.createObjectURL(blob),
                urls: [URL.createObjectURL(blob)]
              })
            }
          }
        }
      })
    }
    if (e == 'pt') {
console.log(e)
      wx.request({
        url: 'https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=' + access_token,
        data: {
          width: 430,
          scene: 'hello'
        },
        header: {
          'content-type': 'text/plain;charset=UTF-8', // 默认值
          'Accept': '*/*'
        },
        method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
        responseType: 'arraybuffer',
        success: function (data) {
          if (data) {
            console.log(data)
            if (data.data != undefined) {
              let blob = new Blob([data.data], { type: 'image/jpeg' })
              that.getCanvasImage(URL.createObjectURL(blob))
              that.setData({
                url: URL.createObjectURL(blob),
                urls: [URL.createObjectURL(blob)]
              })
            }
          }
        }
      })
    }
  },
  showTankuang: function (msg) {
    wx.showModal({
      title: '提示',
      content: msg,
      showCancel: false,
      success: function (res) {
        
      }
    })
  },
  previewImage: function (e) {
    wx.canvasToTempFilePath({
      canvasId: 'firstCanvas',
      success: function (res) {
        console.log(res.tempFilePath)
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success(res) {
            wx.showToast({
              title: '成功',
              icon: 'success',
              duration: 2000
            })
          }
        })
      }
    })
    
   
  },
  getCanvasImage: function(options) {
    // 使用 wx.createContext 获取绘图上下文 context
    var context = wx.createCanvasContext('firstCanvas')
    var width = ''
    wx.getSystemInfo({
      success: function (res) {
        width = res.windowWidth
      }
    })
    
    context.drawImage(options, 0, 0, width, width)
    context.stroke()
    context.draw()
  }
}) 