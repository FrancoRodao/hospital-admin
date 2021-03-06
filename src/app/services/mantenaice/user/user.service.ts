import { Injectable, NgZone } from '@angular/core';
import { User } from 'src/app/models/user.model';
import { HttpClient } from "@angular/common/http";
import { map, catchError, tap } from "rxjs/operators";
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import {  of, Observable } from 'rxjs';
import { SnackbarService } from '../../shared/snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  url: string = environment.URL_SERVICES
  user: User

  constructor(
    private http: HttpClient,
    private snackBar: SnackbarService,
    private router: Router,
    private ngZone: NgZone
  ) {

    this.loadUserInfo()

  }

  get role(): 'ADMIN_ROLE' | 'USER_ROLE'{
    return this.user.role
  }

  registerUser(user: User){

    const url = this.url+'/users'

    return this.http.post(url,user).pipe(map((res: any)=>{
      this.snackBar.snackBar('¡Registered user!','',3000)
      return res.user
    }))
  }

  saveUser(token: string,user: User){

    this.user = User.instanceUser(user)
    localStorage.setItem('token',token)
    localStorage.setItem('user', JSON.stringify(user))
  }

  loadUserInfo(){
    if(localStorage.getItem('user') && localStorage.getItem('token')){
      try {
        this.user = User.instanceUser(JSON.parse(localStorage.getItem('user')))
      } catch (error) {
        this.logout()
      }
    }else{
      this.logout()
      return
    }
  }

  editUser(user: User){
    const url = this.url+`/users`
    return this.http.put(url, user)
    .pipe(map((res: any)=> {
        this.saveUser(this.getToken(),res.user)
        this.loadUserInfo()
        this.snackBar.snackBar('¡Updated User!','',3000)
        return true
    }))
  }

  loginUser(user: User, remember: boolean){
    const url = this.url+'/signin'

    if(remember){
      localStorage.setItem('email',user.email)
    }else{
      localStorage.removeItem('email')
    }

    return this.http.post(url, user).pipe(
      map((res: any)=>{
      this.saveUser(res.message.token,res.message.user)
      this.saveMenu(res.menu)
      this.loadUserInfo()
      return true
      }
    ))
  }

  loginUserGoogle(token: string){
    const url = this.url+'/signin/google'
    return this.http.post(url, {
      'token': token
    }).pipe(
      tap((res: any) => {
        this.saveUser(res.token,res.user)
        this.saveMenu(res.menu)
      })
    )
  }

  logout(){
    this.user = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('menu')
    this.ngZone.run(()=> {
      this.router.navigateByUrl('/login')
    })
    
  }

  getToken(): string{
    return localStorage.getItem('token') || ''
  }

  searchUsers(term: string, page: number){
    const url = environment.URL_SERVICES+`/search/users/${term}?page=${page}`
    return this.http.get(url).pipe(map(res=>{
      return {
        search: res,
        lastSearch: url
      }
    }))
  }

  deleteUser(id: string){
    const url = environment.URL_SERVICES+`/users/${id}`
    return this.http.delete(url).pipe(map((res: any)=>{
      return res.message
    }))
  }

  getAllUsers(page: number = 1){
    const url = environment.URL_SERVICES+`/users?page=${page}`
    return this.http.get(url)
  }

  changeRole(user: User,role: 'ADMIN_ROLE' | 'USER_ROLE'){
    const url = environment.URL_SERVICES+`/users/${user._id}`

    user.role = role


    return this.http.put(url,user)
  }

  isLogged(): Observable<boolean>{
    //VALIDA EL TOKEN LO RENUEVA Y REGRESA TRUE O FALSE DEPENDIENDOD E SI EL TOKEN ES VLAIDO
    const url = environment.URL_SERVICES+`/login/renew`
    return this.http.get(url).pipe(
      map( (res: any) => {
        this.saveUser(res.token,res.user)
        this.saveMenu(res.menu)
        return true;
      }),
      catchError( err => {
        return of(false)
      })
    )
  }

  saveMenu(menu){
    localStorage.setItem('menu', JSON.stringify(menu))
  }

  

}
