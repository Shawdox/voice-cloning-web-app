package routes

import (
	"voice-clone-backend/handlers"
	"voice-clone-backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// 应用CORS中间件
	r.Use(middleware.CORSMiddleware())

	// API v1路由组
	v1 := r.Group("/api/v1")
	{
		// 公开路由（无需认证）
		auth := v1.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.POST("/login/sms", handlers.LoginWithSMS) // SMS登录
			auth.POST("/sms/send", handlers.SendSMS)
		}

		// 需要认证的路由
		authorized := v1.Group("")
		authorized.Use(middleware.AuthMiddleware())
		{
			// 用户相关
			authorized.GET("/profile", handlers.GetProfile)
			authorized.PATCH("/profile/password", handlers.ChangePassword) // 修改密码

			// 文件上传
			authorized.POST("/upload/audio", handlers.UploadAudio)
			authorized.GET("/upload/audio", handlers.GetUploadedFiles)
			authorized.DELETE("/upload/audio/:id", handlers.DeleteUploadedFile)
			authorized.POST("/upload/text", handlers.UploadText)

			// 音色管理
			voices := authorized.Group("/voices")
			{
				voices.POST("", handlers.CreateVoice)                   // 创建音色
				voices.GET("", handlers.GetVoices)                      // 获取音色列表
				voices.GET("/predefined", handlers.GetPredefinedVoices) // 获取系统预定义音色
				voices.GET("/:id", handlers.GetVoice)                   // 获取音色详情
				voices.PATCH("/:id", handlers.UpdateVoice)              // 更新音色（置顶等）
				voices.GET("/:id/status", handlers.GetVoiceStatus)      // 查询音色状态
				voices.DELETE("/:id", handlers.DeleteVoice)             // 删除音色
			}

			// TTS生成
			tts := authorized.Group("/tts")
			{
				tts.POST("", handlers.CreateTTS)                  // 创建TTS任务
				tts.GET("", handlers.GetTTSTasks)                 // 获取任务列表
				tts.GET("/:id", handlers.GetTTSTask)              // 获取任务详情
				tts.GET("/:id/status", handlers.GetTTSTaskStatus) // 查询任务状态
				tts.DELETE("/:id", handlers.DeleteTTSTask)        // 删除任务
			}

			// 历史记录（别名到TTS任务）
			authorized.GET("/history", handlers.GetHistory) // 获取历史记录

			// VIP管理
			vip := authorized.Group("/vip")
			{
				vip.GET("/status", handlers.GetVIPStatus) // 查询VIP状态
				vip.POST("/upgrade", handlers.UpgradeVIP) // 升级VIP
			}

			// 积分管理
			credits := authorized.Group("/credits")
			{
				credits.GET("/balance", handlers.GetCreditsBalance)          // 查询积分余额
				credits.GET("/transactions", handlers.GetCreditTransactions) // 交易记录
				credits.POST("/recharge", handlers.CreateRechargeOrder)      // 创建充值订单
				credits.GET("/orders/:order_no", handlers.CheckOrderStatus)  // 查询订单状态
			}
		}

		// 管理员路由（独立认证系统）
		admin := v1.Group("/admin")
		{
			// 管理员登录（无需认证）
			admin.POST("/login", handlers.AdminLogin)

			// 需要管理员认证的路由
			adminProtected := admin.Group("")
			adminProtected.Use(middleware.AdminAuthMiddleware())
			{
				adminProtected.GET("/traffic", handlers.GetTrafficStats)
				adminProtected.GET("/users", handlers.GetUsersList)
				adminProtected.PUT("/users/:id/toggle", handlers.ToggleUserStatus)
				adminProtected.GET("/oss", handlers.GetOSSInfo)
				adminProtected.GET("/fish-audio", handlers.GetFishAudioInfo)
			}
		}
	}

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
