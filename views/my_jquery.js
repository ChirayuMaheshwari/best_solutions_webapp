$(document).ready(function(){
    console.log("hello world");
    
    $('#user_name').on(
       {
         focusout: function(e){
            console.log("hello world we are on user name")
            e.preventDefault()
            var user_name=$("#user_name").val()
            console.log(user_name)
            $.ajax({
                url : "/ajaxdemo",
                data : {
                    text: user_name
                },
                method : "post",
                success : function(res){
                    
                       alert(res.from);
                       
                        
                    
                     
                    
                }
            }


            )
        }
        
       }
    )
    $('#email').on(
        {
          focusout: function(e){
             console.log("hello world we are on email")
             e.preventDefault()
             var user_name=$("#email").val()
             console.log(user_name)
             $.ajax({
                 url : "/ajaxdemo2",
                 data : {
                     text: user_name
                 },
                 method : "post",
                 success : function(res){
                     
                        
                    
                     alert(res.from)
                 }
             }
 
 
             )
         }
         
        }
     )
     $("#reg_number").on(
         {
             blur:function(e){
                 var e
                 e.preventDefault();
                 var reg_number=$("#reg_number").val()
                 var int_val=parseInt(reg_number)
                 int_val=int_val/10000
                var d=new Date()
                var year=d.getFullYear()
                
                if(year-int_val>=4||year-int_val<=-4)
                {
                    $.ajax({
                        url : "/ajaxdemo3",
                        data : {
                            text: reg_number
                        },
                        method : "post",
                        success : function(res){
                            alert(res.from)
                        }
                    }
        
        
                    )
                }
             }
         }
     )
     $('#repassword').on(
        {
          blur: function(e){
             console.log("hello world we are on repassword")
             e.preventDefault()
             var password=$("#password").val()
             var repassword=$("#repassword").val();
             console.log(password)
             if(password!=repassword)
             {
             $.ajax({
                 url : "/ajaxdemo4",
                 data : {
                     password:password,
                     repassword:repassword 
                 },
                 method : "post",
                 success : function(res){
                     document.getElementById('repassword').focus();
                     
                 }
             }
            
 
 
             )
            }
         }
         
        }
     )
     
     
});
