
var crypto=require('crypto'),
	fs=require('fs'),
	User=require('../models/user.js');
var Post=require('../models/post.js');
module.exports=function(app){
	app.get('/',function(req,res){
		Post.getAll(null,function(err,posts){
			if(err){
				posts=[];
			}
		res.render('index',{
			title:'主页',
			user:req.session.user,
			posts:posts,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
			});
		});
	});
	app.get('/reg',checkNotLogin);
	app.get('/reg', function (req, res) {
    res.render('reg', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
	
	app.post('/reg',checkNotLogin);
	app.post('/reg',function(req,res){
		var name=req.body.name,
			password=req.body.password,
			password_re=req.body['password-repeat'];
			
		if(password_re!=password){
			req.flash('error','两次输入的密码不一致！');
			return res.redirect('/reg');
			}
		var md5=crypto.createHash('md5'),
			password=md5.update(req.body.password).digest('hex');
		var newUser=new User({
			name:req.body.name,
			password:password,
			email:req.body.email
		});
		
		User.get(newUser.name,function(err,user){
			if(user){
				req.flash('error','用户已存在！');
				return res.redirect('/reg');
			}
			newUser.save(function(err,user){
				if(err){
					req.flash('error',err);
					return res.redirect('/reg');
				}
				req.session.user=user;
				req.flash('success','注册成功啦！');
				res.redirect('/');
			});
		});
	});
	
	app.get('/login',checkNotLogin);
	app.get('/login',function(req,res){
		res.render('login',{
			title:'登录',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
			});
	});
	
	app.post('/login',checkNotLogin);
	app.post('/login',function(req,res){
		var md5=crypto.createHash('md5'),
			password=md5.update(req.body.password).digest('hex');
			
		User.get(req.body.name,function(err,user){
			if(!user){
				req.flash('error','用户不存在！');
				return res.redirect('/login');
			}
			
			if(user.password!=password){
				req.flash('error','密码错误！');
				return res.redirect('/login');
			}
			
			req.session.user=user;
			req.flash('success','登录成功！');
			res.redirect('/');
		});
	});
	
	app.get('/post',checkLogin);
	app.get('/post',function(req,res){
		res.render('post',{
			title:'发表',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	
	app.post('/post',checkLogin);
	app.post('/post',function(req,res){
		var currentUser=req.session.user,
			post=new Post(currentUser.name,req.body.title,req.body.post);
		post.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success','发布成功!');
			res.redirect('/');
		});
	});
	
	app.get('/logout',checkLogin);
	app.get('/logout',function(req,res){
		req.session.user=null;
		req.flash('success','登出成功！');
		res.redirect('/');
	});
	
	app.get('/upload',checkLogin);
	app.get('/upload',function(req,res){
		res.render('upload',{
			title:'文件上传',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	
	app.post('/upload',checkLogin);
	app.post('/upload',function(req,res){
		for(var i in req.files){
			if(req.files[i].size==0){
				fs.unlinkSync(req.files[i].path);
				console.log('Successfully removed an empty file!');
			}else{
				var target_path='./public/images/'+req.files[i].name;
				
				fs.renameSync(req.files[i].path,target_path);
				console.log('Successfully renamed a file!');
			}
		}
		req.flash('success','文件上传成功');
		res.redirect('/upload');
	});
	
	app.get('/u/:name',function(req,res){
		User.get(req.params.name,function(err,user){
			if(!user){
				req.flash('error','用户不存在');
				return res.redirect('/');
			}
			//查询并返回该用户的所有文章
			Post.getAll(user.name,function(err,posts){
				if(err){
					req.flash('error',err);
					return res.redirect('/');
				}
				res.render('user',{
					title:user.name,
					posts:posts,
					user:req.session.user,
					success:req.flash('success').toString(),
					error:req.flash('error').toString()
				});
			});
		});
	});
	
	app.get('/u/:name/:day/:title',function(req,res){
		Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			
			res.render('article',{
				title:req.params.title,
				post:post,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	
	app.get('/edit/:name/:day/:title',checkLogin);
	app.get('/edit/:name/:day/:title',function(req,res){
		var currentUser=req.session.user;
		
		Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post){
			if(err){
				req.flash('error','编辑失败');
				return res.redirect('back');
			}
			
			res.render('edit',{
				title:"编辑",
				post:'post',
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	
	app.post('/edit/:name/:day/:title',checkLogin);
	app.post('/edit/:name/:day/:title',function(req,res){
		var currentUser=req.session.user;
		Post.update(currentUser.name,req.params.day,req.params.title,req.body.post,function(err){
			var url='/u/'+req.params.name+'/'+req.params.day+'/'+req.params.title;
			if(err){
				req.flash('error',err);
				return res.redirect(url);
			}
			req.flash('success','修改成功！');
			res.redirect(url);
		});
	});
	
	app.get('/remove/:name/:day/:title',checkLogin);
	app.get('/remove/:name/:day/:title',function(req,res){
		var currentUser=req.session.user;
		Post.remove(currentUser.name,req.params.day,req.params.title,function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			
			req.flash('success','删除成功！');
			res.redirect('/');
		});
	});
	
	function checkLogin (req,res,next){
		if(!req.session.user){
			req.flash('error','未登录！');
			res.redirect('/login');
		}
		next();
	}
	
	function checkNotLogin(req,res,next){
		if(req.session.user){
			req.flash('error','已登录！');
			res.redirect('back');
		}
		next();
	}
};